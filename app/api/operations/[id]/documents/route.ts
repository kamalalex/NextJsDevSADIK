import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyAuth } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!type) {
            return NextResponse.json({ error: "Document type is required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

        // Create directory if it doesn't exist
        const relativeUploadDir = `/uploads/documents/${id}`;
        const uploadDir = path.join(process.cwd(), "public", relativeUploadDir);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            console.error("Error creating directory:", e);
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const fileUrl = `${relativeUploadDir}/${filename}`;

        // Create Document record
        const document = await prisma.document.create({
            data: {
                operationId: id,
                type: type as any, // Cast to any to check if valid enum later or trust client for now
                url: fileUrl,
                filename: file.name,
                uploadedById: auth.userId,
            },
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("Error uploading document:", error);
        return NextResponse.json(
            { error: "Error uploading document" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const documents = await prisma.document.findMany({
            where: {
                operationId: id
            },
            include: {
                uploadedBy: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(documents);

    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Error fetching documents" },
            { status: 500 }
        );
    }
}
