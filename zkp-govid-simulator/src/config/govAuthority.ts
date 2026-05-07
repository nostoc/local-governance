import { Wallet } from 'ethers';

type GovWallet = {
  address: string;
  signMessage: (message: string | Uint8Array) => Promise<string>;
};

let govWallet: GovWallet | null = null;

const getGovWallet = (): GovWallet => {
  if (govWallet) {
    return govWallet;
  }

  const envPrivateKey = process.env.GOV_PRIVATE_KEY;
  if (envPrivateKey) {
    govWallet = new Wallet(envPrivateKey);
    return govWallet;
  }

  // Dev-only fallback so local startup still works if GOV_PRIVATE_KEY is not set.
  govWallet = Wallet.createRandom();
  console.warn('⚠️ GOV_PRIVATE_KEY is not set. Using an ephemeral key for this run.');
  console.warn('⚠️ Set GOV_PRIVATE_KEY in .env to keep authority address stable across restarts.');
  return govWallet;
};

const getGovAuthorityAddress = (): string => {
  return getGovWallet().address;
};

export { getGovWallet, getGovAuthorityAddress };
