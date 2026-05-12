import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Reporting", (m) => {
  const reporting = m.contract("Reporting");
  return { reporting };
});