-- Trigger-only functions must not be exposed as PostgREST RPC endpoints.
-- Revoking EXECUTE from the API roles hides them from the API; the triggers
-- themselves keep firing (trigger execution is independent of these grants).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_ticket_number() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
