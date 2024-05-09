import { expect } from "chai";
import hre from "hardhat";

describe('Builder', () => {
  
  async function deployBuilder() {
    const [owner] = await hre.ethers.getSigners();
    
    const Builder = await hre.ethers.getContractFactory('Builder')
    
    const builder = await Builder.deploy(owner)
    
    return {
      owner, builder, Builder
    }
  }
  
  let builderDeployed: Awaited<ReturnType<typeof deployBuilder>>
  // Before all - deploy the builder
  before(async () => {
    builderDeployed = await deployBuilder();
  })
  
  describe('Deployment', async () => {
    
    it('Should deploy correctly', async () => {
      const { owner, builder } = builderDeployed
      
      expect(owner.address).to.be.a('string')
      expect(await builder.getAddress()).to.be.a('string')
    })
    
    it('Should have no users in the community', async () => {
      const { builder }  = builderDeployed
      
      const totalUsers = await builder.getTotalUsers()
      expect(totalUsers).to.be.a('bigint')
      
      expect(totalUsers).to.equal(0)
    })
  })
  
  describe('Functionality', () => {
    
    it('The owner should join the community', async () => {
      const { builder, owner } = builderDeployed
      
      await builder.connect(owner).joinCommunity()
      
      const totalUsers = await builder.getTotalUsers()
      
      expect(totalUsers).to.equal(1)
    })
    
    it('The owner should pause the contract', async () => {
      const { builder } = builderDeployed
      
      await builder.pause()
      
      const isContractPaused = await builder.paused()
      
      expect(isContractPaused).to.equal(true)
    })

    it('A random user cannot join because the contract is paused', async () => {
      const { builder, Builder } = builderDeployed
      
      const [, randomUserOne] = await hre.ethers.getSigners()
      
      const errorWhenUserJoinsCommunityPromise = builder.connect(randomUserOne).joinCommunity()
      
      await expect(errorWhenUserJoinsCommunityPromise).to.be.revertedWithCustomError(Builder, 'EnforcedPause')
    })

    it('The contract is unpaused', async () => {
      const { builder } = builderDeployed
      await builder.unpause()

      const isContractPaused = await builder.paused()

      expect(isContractPaused).to.equal(false)
    })

    it('A random user can join and event is emitted', async () => {
      const { builder, Builder } = builderDeployed

      const [, randomUserOne] = await hre.ethers.getSigners()
      
      await builder.connect(randomUserOne).joinCommunity()

      expect(Builder).to.emit(Builder, 'UserJoined')
      .withArgs(randomUserOne.address)
    })

    it('The total users should be 2', async () => {
      const { builder } = builderDeployed

      const totalUsers = await builder.getTotalUsers()

      expect(totalUsers).to.equal(2)
    })
    
  })
})