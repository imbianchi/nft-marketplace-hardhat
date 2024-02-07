import { useEffect, useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'

import { NFTStorage, File } from 'nft.storage'
const client = new NFTStorage({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEYxNDE4ZDBDODQyODljYThCN2ZkM0UxRDFjQjEzOTRBQzAzOGVDNEMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcwNTY5Nzg4MzAyMCwibmFtZSI6Im5mdC1tYXJrZXRwbGFjZS1sb2NhbCJ9.aeYSzGcazWQIYyBKzYEcITQCwBffy-rHl8IPgFWLorw' })

const Create = ({ marketplace, nft }) => {
    const [loading, setLoading] = useState(false);

    const [imageUrl, setImageUrl] = useState('');
    const [price, setPrice] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const uploadToIPFS = async (event) => {
        event.preventDefault();

        const file = event.target.files[0];

        if (typeof file !== 'undefined') {
            try {
                const metadataCID = await client.store({
                    name,
                    description,
                    image: new File([file], file.name, { type: file.type }),
                })

                setImageUrl(metadataCID.url);
            } catch (error) {
                console.log("IPFS image upload error: ", error);
            }
        }
    }

    const createNFT = async () => {
        if (!imageUrl || !price || !name || !description) return;

        try {
            mintThenList({ imageUrl, name, description })
        } catch (error) {
            console.log("ipfs uri upload error: ", error)
        }
    }

    const mintThenList = async (result) => {
        setLoading(true);

        const uri = result.imageUrl;
        await (await nft.mint(uri)).wait();

        const id = await nft.tokensCount();

        await (await nft.setApprovalForAll(marketplace.address, true)).wait();

        const listingPrice = ethers.utils.parseEther(price.toString());
        await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();

        setLoading(false);
    }

    return (
        <div className="container-fluid mt-5" >
            <div className="row">
                {
                    loading ? (
                        <main style={{ padding: "1rem 0" }}>
                            <h2>Loading...</h2>
                        </main>
                    ) : (
                        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                            <div className="content mx-auto">
                                <Row className="g-4">
                                    <Form.Control
                                        onChange={(e) => setName(e.target.value)}
                                        size="lg"
                                        required
                                        type="text"
                                        placeholder="Name"
                                    />
                                    <Form.Control
                                        onChange={(e) => setDescription(e.target.value)}
                                        size="lg"
                                        required
                                        as="textarea"
                                        placeholder="Description"
                                    />
                                    <Form.Control
                                        onChange={(e) => setPrice(e.target.value)}
                                        size="lg"
                                        required
                                        type="number"
                                        placeholder="Price in ETH"
                                    />
                                    <Form.Control
                                        type="file"
                                        required
                                        name="file"
                                        onChange={uploadToIPFS}
                                    />
                                    <div className="d-grid px-0">
                                        <Button
                                            onClick={createNFT}
                                            variant="primary"
                                            size="lg"
                                        >
                                            Create & List NFT!
                                        </Button>
                                    </div>
                                </Row>
                            </div>
                        </main>
                    )
                }
            </div>
        </div >
    );
}

export default Create