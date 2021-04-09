export function saveToken(token: string): void {
  localStorage.setItem("token", token);
}

export function getToken(): string {
  return localStorage.getItem("token") as string;
}
