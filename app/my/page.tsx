import type { Metadata } from "next";
import MyList from "@/components/MyList";
import PageHero from "@/components/PageHero";
import InstallButton from "@/components/InstallButton";
import LeadForm from "@/components/LeadForm";
import SyncPanel from "@/components/SyncPanel";
import { dbEnabled } from "@/lib/db";

export const metadata: Metadata = { title: "My list", description: "Your saved anime and their next episodes.", robots: { index: false, follow: true } };

export default function MyPage() {
  return (
    <div className="container-x pb-8">
      <PageHero eyebrow="Your anime" title={<>My <span className="text-gradient">list</span></>} subtitle="No account needed. Your list is saved in this browser and can sync to your other devices with a private code. Next-episode times refresh every time you open this page, and the list works offline once you've opened it." hue={300}>
        <InstallButton />
      </PageHero>
      {dbEnabled() && <div className="mt-8"><SyncPanel /></div>}
      <div className="mt-8"><MyList /></div>
      {dbEnabled() && <LeadForm className="mt-10" kind="digest" source="mylist-digest" title="📰 Get the weekly anime digest" blurb="Every Friday: new episodes, premieres and the week's news, in one short email." button="Subscribe" />}
    </div>
  );
}
