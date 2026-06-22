export type ShellOrg = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type ShellUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};
