// Lovable Cloud auth is NOT used in this build. The portal reads/writes to
// external Supabase projects directly and skips the sign-in gate, so this
// file is just a no-op shim that keeps existing imports compiling.

export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: 'google' | 'apple' | 'microsoft',
      _opts?: { redirect_uri?: string; extraParams?: Record<string, string> },
    ): Promise<{ error?: Error; redirected?: boolean }> => {
      return {
        error: new Error(
          'Sign-in is disabled in this build. The portal opens directly without an account.',
        ),
      };
    },
  },
};
