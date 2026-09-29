"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/services/i18n/client";

type Post = {
  title: string;
  date: string;
};

const DUMMY_POSTS: Post[] = [
  { title: "Getting Started with Next.js 16", date: "2026-09-01" },
  { title: "Understanding the Module Registry", date: "2026-09-12" },
  { title: "Writing Your First Extension Manifest", date: "2026-09-25" },
];

export function PostActivityTab() {
  const { t } = useTranslation("module-post");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.column1")}</TableHead>
            <TableHead>{t("table.column2")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DUMMY_POSTS.map((post, i) => (
            <TableRow key={i}>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PostActivityTab;
