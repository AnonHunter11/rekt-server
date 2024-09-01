import { collections, LAMPORTS_PER_SOL } from './consts';
import fetch from 'node-fetch';
import { TransactionInstruction, PublicKey, Transaction } from '@solana/web3.js';
import { connection } from '../../shared/connection';
import { priceData } from './tradingData';
import {key} from './consts';
import {Buffer} from 'buffer';
function dateToTimestamp(dateString: string): number {
    return new Date(dateString).getTime() / 1000;
}
export interface NFTOwnershipResponse {
    next: string | null;
    nfts: any[]; // You might want to define a more specific type for NFTs
}

export async function getNFTOwnership(
    collectionIds: string[],
    walletAddress: string,
    limit: number = 50
): Promise<any> {
    const API_KEY = key!;
    const BASE_URL = 'https://api.simplehash.com/api/v0/nfts/owners';
    const params = new URLSearchParams({
        chains: 'solana',
        wallet_addresses: walletAddress,
        collection_ids: collectionIds.join(','),
        limit: limit.toString()
    });

    const url = `${BASE_URL}?${params}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching NFT ownership:', error);
        throw error;
    }
}
async function getAthAfterTimestamp(slug: string, timestamp: number, buyPrice: number, buyNowPrice: number): Promise<number> {
    try {
        // Get the price data for the given slug
        const data = priceData[slug];
        if (!data) {
            throw new Error(`No price data found for slug: ${slug}`);
        }

        // Find the highest price after the given timestamp
        let ath = buyPrice;
        for (const [dataTimestamp, price] of Object.entries(data)) {
            // Convert timestamp to number and compare
            if (parseInt(dataTimestamp) > timestamp) {
                // Eğer fiyat şu ana kadarki ATH'den yüksekse, ATH'yi güncelle
                ath = Math.max(ath, price as number);
            }
        }
        return ath - buyNowPrice;
    } catch (error) {
        console.error(`Error processing ${slug}: ${error}`);
        return 0;
    }
}
export function getIcon(data: any): string {
    if(data.length === 0) 
        return 'https://i.imgur.com/wNweos0.png';
    const encodedLosses = encodeURIComponent(JSON.stringify(data));
    const url = `https://rekt-action.vercel.app/api/router.ts?losses=${encodedLosses}`;
    return url;
}
export async function buildTransaction(account: string): Promise<string> {
    const { blockhash } = await connection.getLatestBlockhash();
    const transferInstruction = new TransactionInstruction({
        keys: [
            { pubkey: new PublicKey(account), isSigner: true, isWritable: true },
            { pubkey: new PublicKey(account), isSigner: false, isWritable: true },
        ],
        programId: new PublicKey('11111111111111111111111111111111'),
        data: Buffer.from([2, 0, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0]), //1000 lamport for abuse prevention
    });
    const transaction = new Transaction().add(transferInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(account);
    return transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    }).toString('base64');
}
function getByID(collectionId: string): string | undefined {
    const entries = Object.entries(collections);
    const foundEntry = entries.find(([_, value]) => value === collectionId);
    return foundEntry ? foundEntry[0] : undefined;
}
export async function processCollections(walletAddress: string) {
    try {
        const collectionIds = Object.values(collections);
        const losses: any[] = [];
        for (let i = 0; i < 5; i++) {
            const chunk = collectionIds.slice(i * 40, Math.min((i + 1) * 40, collectionIds.length));

            const result = await getNFTOwnership(chunk, walletAddress);
            if (Array.isArray(result.nfts)) {
                const promises = result.nfts.map(async (item: any) => {
                    try {
                        const timestamp = dateToTimestamp(item.last_sale?.timestamp) || 0;
                        const buyPrice = item.last_sale?.unit_price / LAMPORTS_PER_SOL || 0;
                        const floorPrice = item.collection.floor_prices?.[1]?.value / LAMPORTS_PER_SOL || 0;
                        const collectionId = getByID(item.collection.collection_id);

                        if (collectionId) {
                            const loss = await getAthAfterTimestamp(collectionId + 1, timestamp, buyPrice, floorPrice);
                            losses.push({ loss: loss, item: item.previews.image_medium_url });
                        } else {
                        }
                    } catch (error) {
                        console.error(`Error processing item:`, error);
                    }
                });
                await Promise.all(promises);
            } 
        }
        return losses;
    } catch (error) {
        console.error('Error reading or processing file:', error);
    }
}
