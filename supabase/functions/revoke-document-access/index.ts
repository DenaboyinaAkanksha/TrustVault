const allowedOrigins = [
  'http://localhost:5173',
  'https://trustvault-icl60lbq5-trust-vault5.vercel.app',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.includes(origin)
      ? origin
     : 'https://trustvault-icl60lbq5-trust-vault5.vercel.app'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  })

  const { data: userData, error: userError } =
    await userClient.auth.getUser()

  if (userError || !userData.user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid session' }),
      {
        status: 401,
        headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      },
    )
  }

  let body: {
    document_id?: string
    recipient_user_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  if (!body.document_id || !body.recipient_user_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: document, error: documentError } = await adminClient
    .from('documents')
    .select('id, owner_id')
    .eq('id', body.document_id)
    .maybeSingle()

  if (documentError || !document) {
    return new Response(
      JSON.stringify({ success: false, error: 'Document not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  if (document.owner_id !== userData.user.id) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Only the document owner can revoke access',
      }),
      {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }


  const { error: revokeError } = await adminClient.rpc(
    'revoke_document_access_with_audit',
    {
      p_document_id: body.document_id,
      p_recipient_user_id: body.recipient_user_id,
      p_actor_id: userData.user.id,
    },
  )

  if (revokeError) {
    return new Response(
      JSON.stringify({ success: false, error: 'Could not revoke access' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )
})