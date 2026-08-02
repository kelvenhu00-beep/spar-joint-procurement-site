export function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("D1 binding `DB` is unavailable")) {
    return "数据库绑定 DB 不可用。请在 .openai/hosting.json 中启用 d1 字段，并部署带有迁移文件的版本。";
  }

  if (combined.includes("no such table")) {
    return "数据库表尚未创建。请运行 npm run db:generate 生成迁移，并部署到 Sites 后由平台应用迁移。";
  }

  return message;
}

export function badRequest(error: string) {
  return Response.json({ error }, { status: 400 });
}

export function serverError(error: unknown) {
  return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
}

export function makeId(prefix: string) {
  const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 18);
  return `${prefix}_${randomPart}`;
}
