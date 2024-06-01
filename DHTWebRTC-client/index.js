import DHT from './src/dht'
import Peer from './src/dht/lib/Peer';

const generateKeys = async () => window.crypto.subtle.generateKey(
    {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
)

const encrypt = async (publicKey, data) => window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
);

const decrypt = async (privateKey, data) => window.crypto.subtle.decrypt(
    {
        name: "RSA-OAEP"
    },
    privateKey,
    data
);

const importPublicKey = async (publicKey) => await window.crypto.subtle.importKey(
    "spki",
    publicKey,
    {
        name: "RSA-OAEP",
        hash: "SHA-256",
    },
    true,
    [ "encrypt" ]
);

const exportPublicKey = async (publicKey) => await window.crypto.subtle.exportKey('spki', publicKey)



var hash;
var hexHash;
var dht;

const createOfferBtn = async () => {
    document.querySelector('.answer-btn').removeEventListener('click', createAnswerBtn)

    const uHexHash = document.querySelector('.hash-inp').value;

    const offer = await dht.createOffer(uHexHash);

    const a = document.createElement("a");
    const file = new Blob([JSON.stringify({
        uHexHash: hexHash,
        sdp: offer
    })], {type : 'text/sdp'});
    const url = window.URL.createObjectURL(file)
    
    a.href = url; 
    a.download = "offer.sdp";
    a.click();

    window.URL.revokeObjectURL(url);

    document.querySelector('.answer-btn').addEventListener('click', setAnswerBtn)
}

const setAnswerBtn = async () => {
    let reader = new FileReader();

    reader.readAsText(document.querySelector('.file-inp').files[0]);

    reader.onload = async () => {
        const answer = JSON.parse(reader.result).sdp;
        const uHexHash = JSON.parse(reader.result).uHexHash;
        await dht.setAnswer(uHexHash, answer);
        document.querySelector('.answer-btn').removeEventListener('click', setAnswerBtn)
        document.querySelector('.answer-btn').addEventListener('click', createAnswerBtn)
    };
}


const createAnswerBtn = async () => {
    let reader = new FileReader();

    reader.readAsText(document.querySelector('.file-inp').files[0]);

    reader.onload = async () => {
        const offer = JSON.parse(reader.result).sdp;
        const uHexHash = JSON.parse(reader.result).uHexHash;

        document.querySelector('.hash-inp').value = uHexHash;

        const answer = await dht.createAnswer(uHexHash, offer);

        const a = document.createElement("a");
        const file = new Blob([JSON.stringify({
            uHexHash: hexHash,
            sdp: answer
        })], {type : 'text/sdp'});
        const url = window.URL.createObjectURL(file)
        
        a.href = url; 
        a.download = "answer.sdp";
        a.click();

        window.URL.revokeObjectURL(url);
    };
}

async function init() {
    const keys = await generateKeys();

    const publicKey = keys.publicKey;
    const privateKey =  keys.privateKey;

    const spkiPublicKey = await exportPublicKey(publicKey);

    hash = new String(Math.floor(Math.random() * 1000));
    hexHash = hash;

    dht = new DHT.PeerDHT(hexHash, publicKey, privateKey);

    dht.on('message', (e) => {
        const [id, event] = e.detail;
        const message = JSON.parse(event.data);
        console.log(message)
    })

    document.querySelector('.hash').innerHTML = hexHash
    document.querySelector('.offer-btn').addEventListener('click', createOfferBtn)
    document.querySelector('.answer-btn').addEventListener('click', createAnswerBtn)
    document.querySelector('.test').addEventListener('click', () => {
        console.log(dht.neighbors)
        console.log(dht.state)
    })
}

init()