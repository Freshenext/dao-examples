import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe('Governor', () => {
  
  // Function to deploy the Governor here
  async function deployGovernor() {
    const [owner, signer2] = await hre.ethers.getSigners();
    
    const Token = await hre.ethers.getContractFactory('Francis')
    const tokenDeployed = await Token.deploy(owner)
    
    const Governor = await hre.ethers.getContractFactory('FrancisGovernor')
    
    // const TimelockController = await hre.ethers.getContractFactory('TimelockController')
    // const timelockControllerDeployed = await TimelockController.deploy(1, [owner.address], [owner.address], owner.address)
    
    const tokenDeployedAddress = await tokenDeployed.getAddress()
    // const timelockControllerDeployedAddress = await timelockControllerDeployed.getAddress()
    
    const governorDeployed = await Governor.deploy(tokenDeployedAddress, {
      gasLimit: '30000000'
    })
    
    return {
      owner,
      tokenDeployed,
      governorDeployed
    }
    
  }
  // Finish
  
  async function mintTokens(tokenDeployed, addressToSend, weiValue = '1000') {
    const tokensToMint = hre.ethers.parseUnits(weiValue, 18)
    await tokenDeployed.mint(addressToSend, tokensToMint)
  }
  
  describe('Deployment', () => {
    
    it('Should deploy correctly', async () => {
      const { owner, tokenDeployed } = await deployGovernor()
      
      const name = await tokenDeployed.name()
      console.log(await tokenDeployed.totalSupply())
      expect(name).to.equal('Francis')
    })

    it('Should mint 1000 tokens', async () => {
      const { owner, tokenDeployed } = await deployGovernor()

      await mintTokens(tokenDeployed, owner)
      
      const totalSupply = await tokenDeployed.totalSupply()
      
      expect(totalSupply).to.equal(hre.ethers.parseUnits('1000'))
    })
    
    it('Should get the current block timestamp', async () => {
      const { tokenDeployed }  = await deployGovernor()
      
      const timestamp = await tokenDeployed.clock()
      expect(typeof timestamp).to.equal('bigint')
    })

    it("Should propose, vote, queue, and execute a proposal", async function () {
      const { tokenDeployed: token, governorDeployed }  = await deployGovernor()
      const [owner, voter1, voter2] = await hre.ethers.getSigners()

      // Delegate voting power
      // First mint 1k tokens and BE SURE that it is minted
      await mintTokens(token, owner)
      const totalSupply = await token.totalSupply()
      expect(totalSupply).to.equal(hre.ethers.parseUnits('1000'))
      // Now delegate your voting power to yourself
      await token.delegate(owner)
      // Be SURE that you are your own delegatee
      const delegatee = await token.delegates(owner)
      const ownerAddress = await owner.getAddress()
      expect(delegatee).to.equal(ownerAddress)
      // Transfer ownership to governance
      await token.transferOwnership(governorDeployed)
      
      // Create proposal function and description
      const targets = [await token.getAddress()];
      const values = [0];
      const sigs = ["mint(address,uint256)"];
      const args = [[owner.address, hre.ethers.parseEther("1")]];
      const calldatas = args.map((arg, i) =>
        token.interface.encodeFunctionData(sigs[i], arg)
      );
      const description = "Proposal #1: Mint 10 tokens";

      // Create Proposal in governor
      const proposeTx = await governorDeployed.propose(
        targets, values, calldatas, description
      );
      const proposeReceipt = await proposeTx.wait();
      
      const proposalId = proposeReceipt.logs[0].args.proposalId;

      // Move blocks forward to pass the voting delay
      // await hre.ethers.provider.send("evm_mine", []);
      
      // Voting
      await governorDeployed.connect(owner).castVote(proposalId, 1);
      const [, forVotes] = await governorDeployed.proposalVotes(proposalId)
      expect(forVotes).to.equal(hre.ethers.parseUnits('1000'))
      
      // Move blocks forward to end the voting period
      for(let i = 0; i < 7200; i++) {  // Assuming 7200 as the voting period
        await hre.ethers.provider.send("evm_mine", []);
      }
      // The proposal should be Successful = state 4
      expect(await governorDeployed.state(proposalId)).to.equal(4)
      
      // Execute Proposal
      const descriptionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(description));
      await governorDeployed.execute(targets, values, calldatas, descriptionHash);
      
      // Be sure that the token was minted properly
      expect(await token.totalSupply()).to.be.greaterThan(totalSupply)
    });
  })
})