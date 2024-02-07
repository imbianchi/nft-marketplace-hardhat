const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {
    let deployer, addr1, addr2, nft, marketplace;
    let feePercent = 1;
    let URI = "Sample URI";

    beforeEach(async function () {
        const NFT = await ethers.getContractFactory("NFT");
        const Marketplace = await ethers.getContractFactory("Marketplace");

        [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent)
    });

    describe("Deployment", function () {
        it("Should track name and symbol of the nft colleciton", async function () {
            expect(await nft.name()).to.equal("DApp NFT");
            expect(await nft.symbol()).to.equal("DAPP");
        })

        it("Should track feeAccount and feePercent of the market", async function () {
            expect(await marketplace.feeAccount()).to.equal(deployer.address);
            expect(await marketplace.feePercent()).to.equal(feePercent);
        })
    })

    describe("Minting NFTs", function () {
        it("Should track each minted NFT", async function () {
            await nft.connect(addr1).mint(URI);
            expect(await nft.tokensCount()).to.equal(1);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.tokenURI(1)).to.equal(URI);

            await nft.connect(addr2).mint(URI);
            expect(await nft.tokensCount()).to.equal(2);
            expect(await nft.balanceOf(addr2.address)).to.equal(1);
            expect(await nft.tokenURI(2)).to.equal(URI);
        })
    })

    describe("Making markeplace items", function () {
        beforeEach(async function () {
            await nft.connect(addr1).mint(URI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
        })

        it("Should track newly created item, transfer NFT seller -> mktplace & emit Offered event", async function () {
            await expect(marketplace.connect(addr1).makeItem(nft.address, 1, toWei(1)))
                .to.emit(marketplace, "Offered")
                .withArgs(1, nft.address, 1, toWei(1), addr1.address);

            expect(await nft.ownerOf(1)).to.equal(marketplace.address);
            expect(await marketplace.itemCount()).to.equal(1);

            const item = await marketplace.items(1);
            expect(item.itemId).to.equal(1);
            expect(item.nft).to.equal(nft.address);
            expect(item.tokenId).to.equal(1);
            expect(item.price).to.equal(toWei(1));
            expect(item.sold).to.equal(false);
        })

        it("Should fail if the prices is set to zero", async function () {
            await expect(marketplace.connect(addr1).makeItem(nft.address, 1, 0))
                .to.be.revertedWith("Price must be grater than zero");
        })
    })

    describe("Purchasing marketplace items", function () {
        let price = 2;
        let fee = (feePercent / 100) * price;
        let totalPriceInWei;

        beforeEach(async function () {
            await nft.connect(addr1).mint(URI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
            await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price));
        })

        it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
            const sellerInitialEthBalance = await addr1.getBalance();
            const feeAccountInitialEthBalance = await deployer.getBalance();

            totalPriceInWei = await marketplace.getTotalPrice(1);

            await expect(marketplace.connect(addr2)
                .purchaseItem(1, { value: totalPriceInWei }))
                .to.emit(marketplace, "Bought")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(price),
                    addr1.address,
                    addr2.address,
                )

            const sellerFinalEthBalance = await addr1.getBalance();
            const feeAccountFinalEthBalance = await deployer.getBalance();

            expect(+fromWei(sellerFinalEthBalance))
                .to.equal(+price + +fromWei(sellerInitialEthBalance));

            expect(+fromWei(feeAccountFinalEthBalance))
                .to.equal(+fee + +fromWei(feeAccountInitialEthBalance));

            expect(await nft.ownerOf(1)).to.equal(addr2.address);

            expect((await marketplace.items(1)).sold).to.equal(true);
        })

        it("Should faild for invalid item ids, sold items and when not enough ether is paid", async function () {
            await expect(
                marketplace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
            ).to.be.revertedWith("Item doesn't exist!");

            await expect(
                marketplace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
            ).to.be.revertedWith("Item doesn't exist!");

            await expect(
                marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
            ).to.be.revertedWith("Not enough ether to cover item price and market fee.");

            await marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })
            
            const addr3 = addrs[0]
            await expect(
                marketplace.connect(addr3).purchaseItem(1, { value: totalPriceInWei })
            ).to.be.revertedWith("Item already sold!");

        })
    })
})