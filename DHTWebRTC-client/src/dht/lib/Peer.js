import EventEmitter from "./EventEmitter";

class Peer extends EventEmitter {
    constructor(id) {
        super(['open', 'message', 'close']);

        this.id = id;
        this.peerConnections = {};
        this.dataChannels = {};
    }

    async createOffer(id) {
        this.peerConnections[id] = new RTCPeerConnection();
        this.dataChannels[id] = await this.peerConnections[id].createDataChannel(id);

        this.setupPeerConnection(id);
        this.setupDataChannel(id);
    
        const localDescription = await this.peerConnections[id].createOffer();
        await this.peerConnections[id].setLocalDescription(localDescription);
    
        const offer = await new Promise((resolve, reject) => {
            this.peerConnections[id].onicecandidate = (e) => {
                resolve(this.peerConnections[id].localDescription);
            }
        })
    
        return offer;
    }
    
    async createAnswer(id, offer) {
        this.peerConnections[id] = new RTCPeerConnection();
        this.peerConnections[id].addEventListener('datachannel', event => {
            this.dataChannels[id] = event.channel;
            this.setupDataChannel(id);
        });

        this.setupPeerConnection(id);
    
        await this.peerConnections[id].setRemoteDescription(offer);
        const answer = await this.peerConnections[id].createAnswer();
        await this.peerConnections[id].setLocalDescription(answer);
    
        return answer;
    } 
    
    async setAnswer(id, answer) {
        await this.peerConnections[id].setRemoteDescription(answer);
    }

    setupPeerConnection(id) {
        this.peerConnections[id].addEventListener("connectionstatechange", (event) => {
            if (event.target.connectionState == 'disconnected' || event.target.connectionState == 'failed') {
                this.close(id);
            }
        });
    }

    setupDataChannel(id) {
        this.dataChannels[id].addEventListener('open', event => {
            this.emit('open', [id, event]);
        })
        this.dataChannels[id].addEventListener('message', event => {
            this.emit('message', [id, event]);
        })
    }

    close(id) {
        if (this.peerConnections[id]) {
            this.dataChannels[id].close();
            this.peerConnections[id].close();
            delete this.dataChannels[id];
            delete this.peerConnections[id];
        }
    }

    send(id, data) {
        this.dataChannels[id].send(JSON.stringify(data))
    }
}

export default Peer;