import type { Metadata } from "next";
import MyList from "@/components/MyList";

export const metadata: Metadata = { title: "My list", description: "Your saved anime and their next episodes.", robots: { index: false, follow: true } };

export default function MyPage() {
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">My list</h1>
      <p className="mt-1 mb-6 text-muted">Saved in this browser. Next-episode times refresh every time you open this page.</p>
      <MyList />
    </div>
  );
}
