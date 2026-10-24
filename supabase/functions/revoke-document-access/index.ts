import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      return jsonResponse(
        { error: "Server configuration is incomplete." },
        500,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Please sign in." }, 401);
    }

    // Identify the caller using their own access token.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Invalid session." }, 401);
    }

    const body = await req.json();
    const { document_id, recipient_email, permission } = body;

    if (
      typeof document_id !== "string" ||
      typeof recipient_email !== "string" ||
      !recipient_email.trim() ||
      !["read", "edit"].includes(permission)
    ) {
      return jsonResponse(
        {
          error:
            "Provide a document ID, recipient email, and read or edit permission.",
        },
        400,
      );
    }

    // This privileged client stays on the server only.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Confirm that the signed-in user owns this document.
    const { data: document, error: documentError } =
      await adminClient
        .from("documents")
        .select("id, owner_id")
        .eq("id", document_id)
        .maybeSingle();

    if (documentError) {
      console.error("Document lookup failed:", documentError.message);
      return jsonResponse({ error: "Could not verify document ownership." }, 500);
    }

    if (!document || document.owner_id !== user.id) {
      return jsonResponse(
        { error: "Only the document owner can share it." },
        403,
      );
    }

    // Prevent sharing a document with its own owner.
    const email = recipient_email.trim().toLowerCase();

    if (user.email?.toLowerCase() === email) {
      return jsonResponse(
        { error: "You cannot share a document with yourself." },
        400,
      );
    }

    // Find the recipient using the server-side Admin API.
    let recipientId: string | null = null;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } =
        await adminClient.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        console.error("Recipient lookup failed:", error.message);
        return jsonResponse(
          { error: "Could not look up the recipient." },
          500,
        );
      }

      const recipient = data.users.find(
        (candidate) => candidate.email?.toLowerCase() === email,
      );

      if (recipient) {
        recipientId = recipient.id;
        break;
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    if (!recipientId) {
      return jsonResponse(
        { error: "No registered account was found for that email." },
        404,
      );
    }

    // Update an existing grant or create a new one.
    const { data: existingGrant, error: grantLookupError } =
      await adminClient
        .from("document_access")
        .select("id")
        .eq("document_id", document_id)
        .eq("user_id", recipientId)
        .maybeSingle();

    if (grantLookupError) {
      console.error("Grant lookup failed:", grantLookupError.message);
      return jsonResponse({ error: "Could not check existing access." }, 500);
    }

    if (existingGrant) {
      const { error } = await adminClient
        .from("document_access")
        .update({ permission, granted_by: user.id })
        .eq("id", existingGrant.id);

      if (error) {
        console.error("Grant update failed:", error.message);
        return jsonResponse({ error: "Could not update document access." }, 500);
      }
    } else {
      const { error } = await adminClient
        .from("document_access")
        .insert({
          document_id,
          user_id: recipientId,
          permission,
          granted_by: user.id,
        });

      if (error) {
        console.error("Grant insert failed:", error.message);
        return jsonResponse({ error: "Could not grant document access." }, 500);
      }
    }

    return jsonResponse({
      success: true,
      message: "Document access granted.",
    });
  } catch (error) {
    console.error("Share function failed:", error);
    return jsonResponse({ error: "An unexpected server error occurred." }, 500);
  }
});