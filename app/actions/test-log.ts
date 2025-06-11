"use server"

export async function testServerLog() {
  console.log("--- TEST SERVER LOG FROM ACTION: This should appear in server console! ---")
  return { message: "Log attempt complete." }
}
