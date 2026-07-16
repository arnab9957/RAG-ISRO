import { ChromaClient } from "chromadb";
import { pipeline } from "@xenova/transformers";

const chroma = new ChromaClient({
    host: process.env.CHROMADB_HOST || "localhost",
    port: Number(process.env.CHROMADB_PORT || "8000"),
    ssl: (process.env.CHROMADB_SSL || "false").toLowerCase() === "true",
});

let extractor: any = null;
async function initExtractor() {
    if (!extractor)
        extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    return extractor;
}

async function embedText(text: string) {
    const ext = await initExtractor();
    const output = await ext(text, { pooling: "mean", normalize: true });
    return Array.from(output.data) as number[];
}

async function run() {
    try {
        const name = "IRSARGO_knowledge_base";
        const collection = await chroma.getOrCreateCollection({
            name,
            embeddingFunction: null,
        });
        console.log(`Connected to collection: ${name}`);

        // Try collection.count() if implemented in this client
        try {
            // @ts-ignore - best-effort method check
            if (typeof collection.count === "function") {
                // some clients take no args
                const c = await collection.count();
                console.log("Total items (count):", c);
            } else if (typeof chroma.getCollection === "function") {
                // fallback if client exposes different method
                // @ts-ignore
                const info = await chroma.getCollection({ name });
                console.log("Collection info:", info);
            } else {
                throw new Error("count method not available");
            }
        } catch (e) {
            // Fallback: perform a query with a real embedding and count returned ids
            console.log(
                "Falling back to query-based count (may be approximated).",
                (e as any)?.message || e,
            );
            const emb = await embedText("verification test");
            // request a large number of results to approximate total
            const results = await collection.query({
                queryEmbeddings: [emb],
                nResults: 10000,
            });
            const total = results.ids && results.ids[0] ? results.ids[0].length : 0;
            console.log("Approximate total items (from query):", total);

            if (total > 0) {
                console.log("Sample returned items:");
                for (let i = 0; i < Math.min(3, total); i++) {
                    const id = results.ids?.[0]?.[i];
                    const doc = results.documents?.[0]?.[i];
                    const meta = results.metadatas?.[0]?.[i];
                    console.log(`- id: ${id}`);
                    console.log(`  meta: ${JSON.stringify(meta)}`);
                    console.log(
                        `  doc: ${String(doc).slice(0, 200).replace(/\n/g, " ")}${String(doc).length > 200 ? "..." : ""}`,
                    );
                }
            }
        }
    } catch (err) {
        console.error("Verification failed:", err);
        process.exitCode = 2;
    }
}

run();
