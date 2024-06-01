import Peer from "./Peer";

class PeerDHT extends Peer {
    constructor(id, publicKey, privateKey) {
        super(id);
        
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.neighbors = new Set();
        this.state = 'new';

        this.on('open', (e) => {
            const [id, event] = e.detail;
            this.send(id, {
                event: 'neighbors',
                data: {
                    neighbors: Array.from(this.neighbors)
                }
            });
        });
        
        this.on('message', async (e) => {
            const [id, event] = e.detail;
            const message = JSON.parse(event.data);
            if (message.event == 'neighbors') {
                console.log(message.data.neighbors)
                const nearestId = this.nearestNeighbor(this.id, [...message.data.neighbors, id]);
                if (nearestId == id) {
                    // this.send(id, { event: 'connect' });
                    // this.neighbors.forEach((neighbor) => {
                    //     if (neighbor != id) {
                    //         this.close(neighbor);
                    //     }
                    // })
                    this.neighbors.add(id);
                    this.state = 'bootstraped';
                } else {
                    if (this.state == 'new') {
                        this.neighbors.add(id);
                        this.relay(id, this.id, {
                            event: 'connect',
                            sender: this.id,
                            recipient: this.id
                        });
                    }
                }
            } else if (message.event == 'relay') {
                const nearestId = this.nearestNeighbor(message.recipient, [...this.neighbors, this.id]);
                if (nearestId == this.id) {
                    message.recipient = this.id
                }
                if (this.id == message.recipient) {
                    if(this.peerConnections[message.data.recipient]?.connectionState == 'connected') {
                        this.send(message.data.recipient, {
                            event: 'relay',
                            sender: message.sender,
                            recipient: message.data.recipient,
                            data: message.data
                        });
                    } else if (message.data.event == 'connect') {
                        const offer = JSON.stringify(await this.createOffer(message.data.sender));
                        this.relay(message.recipient, message.sender, {
                            event: 'offer',
                            sender: this.id,
                            recipient: message.data.sender,
                            offer: offer
                        })
                    } else if (message.data.event == 'offer') {
                        const offer = JSON.parse(message.data.offer);
                        const answer = JSON.stringify(await this.createAnswer(message.data.sender, offer));
                        this.relay(message.recipient, message.sender, {
                            event: 'answer',
                            sender: this.id,
                            recipient: message.data.sender,
                            answer : answer
                        })
                    } else if (message.data.event == 'answer') {
                        const answer = JSON.parse(message.data.answer);
                        await this.setAnswer(message.data.sender, answer);
                    }
                } else {
                    this.relay(message.sender, message.recipient, message.data);
                }
            }
        });
    }

    distance(ida, idb) {
        const distance = Math.abs(parseInt(ida) - parseInt(idb));
        return distance
    }

    nearestNeighbor(id, neighbors) {
        var minDistance = Infinity;
        var nearestId;
        for (const nid of neighbors) {
            var distance = this.distance(id, nid);

            if (minDistance > distance) {
                minDistance = distance; 
                nearestId = nid;
            }
        }
        return nearestId;
    }

    relay(sid, rid, data) {
        const nearestId = this.nearestNeighbor(rid, this.neighbors);
        this.send(nearestId, {
            event: 'relay',
            sender: sid,
            recipient: rid,
            data: data
        });
    }

    // connect(neighbors) {
    //     for (const neighbor of neighbors) {
    //         this.relay(this.id, neighbor, {
    //             event: 'connect',
    //             sender: this.id,
    //             recipient: neighbor
    //         });
    //     }
    // }

    // update(neighbors) {
    //     for (const neighbor of neighbors) {
    //         this.relay(this.id, neighbor, {
    //             event: 'connect',
    //             sender: this.id,
    //             recipient: neighbor
    //         });
    //     }
    // }

    // async generateKeys() {
    //     return window.crypto.subtle.generateKey(
    //         {
    //             name: "RSA-OAEP",
    //             modulusLength: 4096,
    //             publicExponent: new Uint8Array([1, 0, 1]),
    //             hash: "SHA-256"
    //         },
    //         true,
    //         ["encrypt", "decrypt"]
    //     )
    // }
    
    async encrypt(publicKey, data) {
        return window.crypto.subtle.encrypt(
            {
            name: "RSA-OAEP",
            },
            publicKey,
            data
        );
    }
    
    async decrypt(privateKey, data) {
        return window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            data
        );
    }

    async importPublicKey(publicKey) {
        return window.crypto.subtle.importKey(
            "spki",
            publicKey,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            [ "encrypt" ]
        );
    }

    // async exportPublicKey(publicKey) {
    //     return awaitif (message.connector != this.id)  window.crypto.subtle.exportKey('spki', publicKey);
    // }
}

export default PeerDHT;