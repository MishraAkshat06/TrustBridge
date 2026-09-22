async function check() {
  const rpcs = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc2.sepolia.org",
    "https://rpc.sepolia.org"
  ];
  const addresses = [
    "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    "0x2e09ba33948b321c8f2d9a123c7eb4011a8fe829"
  ];

  for (const rpc of rpcs) {
    try {
      console.log(`Checking via ${rpc}...`);
      for (const addr of addresses) {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getCode",
            params: [addr, "latest"],
            id: 1
          })
        });
        const json = await res.json();
        const code = json.result || "0x";
        console.log(`  ${addr}: code length = ${code.length} (${code === "0x" ? "EMPTY / NO CONTRACT" : "HAS BYTECODE"})`);
      }
      break;
    } catch (e) {
      console.log(`RPC error with ${rpc}: ${e.message}`);
    }
  }
}
check();
