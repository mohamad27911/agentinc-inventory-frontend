'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gold/20 bg-card/80 p-8 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <span className="text-2xl font-bold text-gold">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">AgentInc</h1>
          <p className="mt-2 text-foreground-muted">Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-5 w-5 text-foreground-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-5 w-5 text-foreground-muted" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gold py-3 font-semibold text-background transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-sm text-foreground-muted">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-gold hover:underline">
              Register
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
