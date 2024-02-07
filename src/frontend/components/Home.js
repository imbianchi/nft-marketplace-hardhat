import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'

const Home = ({ marketplace, nft }) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const loadMarketplaceItems = async () => {
        setLoading(true);

        let itemsCount = 0;
        try {
            itemsCount = await marketplace.itemsCount();
        } catch (error) {
            console.log(error);
        }
        
        for (let index = 1; index <= itemsCount; index++) {
            const item = await marketplace.getItem(index);

            if (!item.sold) {
                const uri = await nft.tokenURI(item.tokenId);
                
                const response = await fetch(encodeURI(uri), {
                    headers: {'Content-Type': 'application/json;'},
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }).then(res => {
                    console.log(res, '-=-=-=-==-=-');
                }).catch(err => console.log(err, '=-=-=-=-=-='));
                const metadata = await response.json();
                const totalPrice = await marketplace.getTotalPrice(item.itemId);

                items.push({
                    totalPrice,
                    itemId: item.itemId,
                    seller: item.seller,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                })
            }
        }

        setItems(items);
        setLoading(false);
    }

    const buyMarketItem = async (item) => {
        await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait();
        loadMarketplaceItems();
    }

    useEffect(() => {
        if (marketplace) {
            loadMarketplaceItems();
        }
    }, [marketplace]);

    return (
        <div className="flex justify-center">
            {
                loading ? (
                    <div style={{ padding: "1rem 0" }}>
                        <h2>Loading...</h2>
                    </div>
                ) : (
                    <>
                        {
                            items.length > 0 ? (
                                <div className="px-5 container">
                                    <Row xs={1} md={2} lg={4} className="g-4 py-5">
                                        {items.map((item, idx) => (
                                            <Col key={idx} className="overflow-hidden">
                                                <Card>
                                                    <Card.Img variant="top" src={item.image} />
                                                    <Card.Body color="secondary">
                                                        <Card.Title>{item.name}</Card.Title>
                                                        <Card.Text>
                                                            {item.description}
                                                        </Card.Text>
                                                    </Card.Body>
                                                    <Card.Footer>
                                                        <div className='d-grid'>
                                                            <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                                                                Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                                                            </Button>
                                                        </div>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ) : (
                                <main style={{ padding: "1rem 0" }}>
                                    <h2>No listed assets</h2>
                                </main>
                            )
                        }
                    </>
                )
            }
        </div>
    );
}
export default Home