import { getContract } from 'thirdweb'
import { getNFT, getNFTs, totalSupply } from 'thirdweb/extensions/erc721'
import { chains, thirdwebClient } from '~/server/utils/evm'

export default defineEventHandler(async (event) => {
  const { id: paramId, chain } = getRouterParams(event)
  const id = paramId.toString().split('-')

  const address = id[0]
  const token = id[1] as unknown as bigint

  const contract = getContract({
    client: thirdwebClient,
    chain: chains[chain],
    address: address,
  })
  const [item, items, supply] = await Promise.all([
    getNFT({ contract, tokenId: token }),
    getNFTs({ contract, count: 10000 }).catch(() => []),
    totalSupply({ contract }).catch(() => 0),
  ])
  const claimed = items.filter((item) => item.tokenURI).length

  // set headers access-control-origin
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  // set headers swr cache 1 minute
  setHeader(event, 'Cache-Control', 's-maxage=60, stale-while-revalidate')

  return {
    item,
    collection: {
      supply: supply.toString(),
      claimed: claimed.toString(),
    },
    explorers: chains[chain].blockExplorers?.map(
      (explorer) => explorer.url + '/token/' + address,
    ),
  }
})
