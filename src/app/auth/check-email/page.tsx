export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-title text-3xl text-rose-950">Check your inbox</h1>
        <p className="mt-4 text-base text-rose-950/65">
          We sent you a confirmation link. Click it to finish creating your account.
        </p>
        <p className="mt-2 text-sm text-rose-950/50">
          Don&apos;t see it? Check your spam folder.
        </p>
      </div>
    </main>
  );
}
