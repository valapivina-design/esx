import { signInAction } from "@/lib/auth/actions";
import { runAuthFormAction } from "@/lib/auth/form-post";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return runAuthFormAction(request, signInAction, "/dashboard");
}
