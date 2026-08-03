import { serverError } from "../../_utils";
import { getCurrentUser } from "../../_auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    return Response.json({ user });
  } catch (error) {
    return serverError(error);
  }
}
