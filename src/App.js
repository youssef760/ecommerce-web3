import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation.js'
import Section from './components/Section.js'
import Product from './components/Product.js'

// ABIs
import UrbanCommerceABI from './abis/UrbanCommerce.json'

// Config
import config from './config.json'


function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [urbanCommerce, setUrbanCommerce] = useState(null)
  const [electronics, setElectronics] = useState(null)
  const [clothing, setClothing] = useState(null)
  const [toys, setToys] = useState(null)
  const [item, setItem] = useState({})
  const [toggle, setToggle] = useState(false)

  const togglePop = (item) => {
    setItem(item)
    toggle ? setToggle(false) : setToggle(true)
  }

  const loadBlockchainData = async () => {
    // Connect to blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const network = await provider.getNetwork()

    // Connect to the smart contract
    const urbanCommerce = new ethers.Contract(
      config[network.chainId].urbanCommerce.address,
      UrbanCommerceABI.abi,
      provider
    )
    setUrbanCommerce(urbanCommerce)

    // Load Product
    const items = []

    for(var i = 0; i < 9; i++) {
      const item = await urbanCommerce.items(i + 1)
      console.log('Item', item)
      items.push(item) 
    }

    const electronics = items.filter((item) => item.category === 'electronics')
    const clothing = items.filter((item) => item.category === 'clothing')
    const toys = items.filter((item) => item.category === 'toys')

    setElectronics(electronics)
    setClothing(clothing)
    setToys(toys)


  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <h2>Urban Best Sellers</h2>

      {electronics && clothing && toys && (
        <>
          <Section title={"Clothing & Jewelry"} items={clothing} togglePop={togglePop} />
          <Section title={"Electronics & Gadgets"} items={electronics} togglePop={togglePop} />
          <Section title={"Toys & Gaming"} items={toys} togglePop={togglePop} />
        </>
      )}

      {toggle && (
        <Product item={item} provider={provider} account={account} urbanCommerce={urbanCommerce} togglePop={togglePop} />
      )}
    </div>
    
  );
}

export default App;
