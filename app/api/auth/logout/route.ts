import { clearSessionCookie, revokeSession } from "../../_auth";
import { serverError } from "../../_utils";

export async function POST(request: Request) {
  try {
    await revokeSession(request);
    return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
  } catch (error) {
    return serverError(error);
  }
}
