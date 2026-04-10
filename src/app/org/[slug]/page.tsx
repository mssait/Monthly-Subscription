import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgRootPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/org/${slug}/dashboard`);
}
