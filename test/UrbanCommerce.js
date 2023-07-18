const { expect } = require("chai")


const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("UrbanCommerce", () => {
  let urbanCommerce
  let deployer, buyer
  const ID = 1
  const NAME = "Shoes"
  const CATEGORY = "Clothing"
  const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
  const COST = tokens(1)
  const RATING = 4
  const STOCK = 5

  beforeEach(async() => {
    [deployer, buyer] = await ethers.getSigners()
    const UrbanCommerce = await ethers.getContractFactory("UrbanCommerce") 
    urbanCommerce = await  UrbanCommerce.deploy()
  })

  describe('Deployment', () => {
    it('Sets the owner', async () => {
      expect(await urbanCommerce.owner() ).to.equal(deployer.address)
    })
  })

  describe('Listing', () => {
    let transaction
    

    beforeEach(async() => {
      transaction = await urbanCommerce.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )

      await transaction.wait()
    })
    it('Returns item attributes', async () => {
      const item = await urbanCommerce.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it('Emits list event', () => {
      expect(transaction).to.emit(urbanCommerce, 'List')
    })

    it('reject listing different from owner', async() => {
      const invalidTransaction = urbanCommerce.connect(buyer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      ) 

      await expect(invalidTransaction).to.be.reverted
    })
  })

  describe('Buying', () => {
    let transaction
    

    beforeEach(async() => {
      transaction = await urbanCommerce.connect(deployer).list(ID,NAME,CATEGORY,IMAGE,COST,RATING,STOCK)
      await transaction.wait()

      transaction = await urbanCommerce.connect(buyer).buy(ID, {value: COST })
    })
    

    it('Update the contract balance', async () => {
      const result = await ethers.provider.getBalance(urbanCommerce.address)
      expect(result).to.equal(COST)
    })

    it("Update buyer's order count", async () => {
      const result = await urbanCommerce.orderCount(buyer.address)
      expect(result).to.equal(1)
    })


    it("Adds the order", async() => {
      const order = await urbanCommerce.orders(buyer.address, 1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Updates the contract balance", async() => {
      const result = await ethers.provider.getBalance(urbanCommerce.address)
      expect(result).to.equal(COST)
    })

    it('Emits Buy event', async() => {
      expect(transaction).to.emit(urbanCommerce, "Buy")
    })
  })

  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await urbanCommerce.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await urbanCommerce.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await urbanCommerce.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(urbanCommerce.address)
      expect(result).to.equal(0)
    })
  })
  
})