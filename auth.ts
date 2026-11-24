import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { githubIdFromProfile } from "@/lib/blog/editor-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [GitHub],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.provider !== "github") return token;
      const profileId = profile && typeof profile === "object" && "id" in profile ? profile.id : undefined;
      const id = githubIdFromProfile(profileId, account.providerAccountId);
      if (id) token.sub = id;
      else delete token.sub;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" && /^[0-9]+$/.test(token.sub) ? token.sub : "";
      }
      return session;
    },
  },
});
