/**
 * PDF Viewer Page
 * 
 * Displays curriculum PDFs inline using browser's native PDF viewer
 * Works offline in Electron by serving PDFs from local filesystem
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import PDFViewerClient from "@/components/PDFViewerClient";

export default async function CurriculumViewerPage({
  searchParams,
}: {
  searchParams: { path?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { status: true },
  });

  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const pdfPath = searchParams.path;
  if (!pdfPath) {
    redirect("/passport");
  }

  // Extract module name from path for display
  const fileName = pdfPath.split("/").pop() || "Curriculum Document";
  const moduleName = fileName.replace(".pdf", "").replace(/_/g, " ");

  return <PDFViewerClient pdfPath={pdfPath} moduleName={moduleName} />;
}
