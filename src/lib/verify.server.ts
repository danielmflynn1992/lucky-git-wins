import { createHash } from "node:crypto";
import { createPublicSkillClient } from "./skill.server";

export type ServerVerification = {
  drawId: string;
  status: "pass" | "fail" | "unverifiable";
  reason: string;
  publishedHash: string | null;
  computedHash: string | null;
  hashMatch: boolean;
  winningNumber: number | null;
  expectedIndex: number | null;
  pickDigest: string | null;
  poolSize: number | null;
  drewFrom: string | null;
  checkedAt: string;
};

const sha256Hex = (input: string) => createHash("sha256").update(input, "utf8").digest("hex");

export async function verifyDrawOnServer(drawId: string): Promise<ServerVerification> {
  const supabase = createPublicSkillClient();
  const { data, error } = await supabase
    .from("draws")
    .select(
      "id, competition_id, winning_number, total_sold, qualifying_pool_size, drew_from, seed_hash, seed_revealed",
    )
    .eq("id", drawId)
    .maybeSingle();

  const base = {
    drawId,
    publishedHash: null,
    computedHash: null,
    hashMatch: false,
    winningNumber: null,
    expectedIndex: null,
    pickDigest: null,
    poolSize: null,
    drewFrom: null,
    checkedAt: new Date().toISOString(),
  };

  if (error) {
    return { ...base, status: "unverifiable", reason: "Could not read that draw." };
  }
  if (!data) {
    return { ...base, status: "unverifiable", reason: "No draw with that ID." };
  }

  const publishedHash = (data.seed_hash ?? "").trim();
  const seed = (data.seed_revealed ?? "").trim();
  const drewFrom = data.drew_from ?? null;
  const pool =
    drewFrom === "qualifying"
      ? (data.qualifying_pool_size ?? 0)
      : (data.total_sold ?? data.qualifying_pool_size ?? 0);

  if (!publishedHash || !seed) {
    return {
      ...base,
      status: "unverifiable",
      reason: "This draw has no sealed seed on record, so there is nothing to re-hash.",
      publishedHash: publishedHash || null,
      winningNumber: data.winning_number ?? null,
      drewFrom,
      poolSize: pool || null,
    };
  }

  const computedHash = sha256Hex(seed);
  const hashMatch = computedHash.toLowerCase() === publishedHash.toLowerCase();

  let expectedIndex: number | null = null;
  let pickDigest: string | null = null;
  if (data.competition_id && pool > 0) {
    const digest = createHash("sha256")
      .update(`draw:${data.competition_id}:${seed}`, "utf8")
      .digest();
    pickDigest = digest.toString("hex");
    const n =
      ((digest[0]! << 24) >>> 0) + (digest[1]! << 16) + (digest[2]! << 8) + digest[3]!;
    expectedIndex = n % pool;
  }

  return {
    drawId,
    status: hashMatch ? "pass" : "fail",
    reason: hashMatch
      ? "Recomputed on our server: the revealed seed hashes to the hash published before tickets closed."
      : "Recomputed on our server: the revealed seed does NOT hash to the published hash.",
    publishedHash,
    computedHash,
    hashMatch,
    winningNumber: data.winning_number ?? null,
    expectedIndex,
    pickDigest,
    poolSize: pool || null,
    drewFrom,
    checkedAt: new Date().toISOString(),
  };
}
