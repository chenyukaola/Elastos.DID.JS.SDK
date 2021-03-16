import { Constants } from "../constants"
import { Document, Service, Subject, Proof, DocumentPublicKey, VerifiableCredential, VerifiablePresentation, Core, Cache} from "../core"
import { Did } from "../did"

export class DidDocument {

    private core: Core

    public constructor (core: Core) {
        this.core = core;
    }

    public newDIDDocument (didElement): Document {
        return new Document(
            didElement.did,
            this.getPublicKeyProperty(didElement),
            [`${didElement.did}#primary`],
            this.getExpiration().toISOString().split('.')[0]+"Z",
            null
        );
    }

    public clone(document: Document) {
        return document.clone();
    }

    public addVerfiableCredentialToDIDDocument (document: Document, vc: VerifiableCredential) {
        if (document.hasProof())
        {
            console.error("You can't modify this document because is already sealed");
            return;
        }

        if (!document.verifiableCredential) document.verifiableCredential = [];
        document.verifiableCredential.push(vc);

    }

    public addVerfiablePresentationToDIDDocument (document: Document, vp: VerifiablePresentation) {
        if (document.hasProof())
        {
            console.error("You can't modify this document because is already sealed");
            return;
        }
        if (!document.verifiablePresentation) document.verifiablePresentation = [];
        document.verifiablePresentation.push(vp);
    }

    public addServiceToDIDDocument (document: Document, service: Service) {
        if (document.hasProof())
        {
            console.error("You can't modify this document because is already sealed");
            return;
        }
        if (!document.service) document.service = [];
        document.service.push(service);
    }


    public createVerifiableCredential (didElement, issuer: Did, subjectName: string, subjectTypes: string[], subjectValue) {
        let issuanceDate = new Date();
        let vcTypes = subjectTypes
        vcTypes.push(issuer === didElement.did ? "SelfProclaimedCredential" : "VerifiableCredential")

        let subject = new Subject(didElement.did);
        subject.name = subjectName;
        subject.value = subjectValue;
        let vc = new VerifiableCredential(
            didElement.did,
            vcTypes,
            issuer,
            issuanceDate.toISOString().split('.')[0]+"Z",
            this.getExpiration(issuanceDate).toISOString().split('.')[0]+"Z",
            subject);

        this.sign(didElement, vc);

        return vc;
    }

    public createService (didElement, did: Did, type, endpoint) {
        let service = new Service(`${did}#${type}`, type, endpoint);

        this.sign(didElement, service);

        return service;
    }


    public createVerifiableCredentialVP (appDid, userDid, appName) {
        let issuanceDate = new Date();
        let vcTypes = ["AppIdCredential"];
        let subject = new Subject(appDid.did);
        subject.appDid = appName;
        subject.appInstanceDid = appDid.did;

        let vc = new VerifiableCredential(
            `${appDid.did}#app-id-credential`,
            vcTypes,
            userDid.did,
            issuanceDate.toISOString().split('.')[0]+"Z",
            this.getExpiration(issuanceDate).toISOString().split('.')[0]+"Z",
            subject);

        this.sign(userDid, vc);

        return vc
    }

    public createVerifiablePresentation (didElement, type, verifiableCredential, realm, nonce) {
        let createDate = new Date();
        let vp = new VerifiablePresentation(type, createDate.toISOString().split('.')[0]+"Z", [verifiableCredential]);

        this.signVp(didElement, vp, realm, nonce);

        return vp;
    }

    public sealDocument (didElement, document) {
        if (document.hasProof())
        {
            console.error("You can't modify this document because is already sealed")
            return
        }

        if (document.verifiableCredential && document.verifiableCredential.length === 0)  delete document.verifiableCredential;
        if (document.verifiablePresentation && document.verifiablePresentation.length === 0) delete document.verifiablePresentation;
        if (document.service && document.service.length === 0) delete document.service;

        let proof = new Proof("ECDSAsecp256r1");
        proof.created = new Date().toISOString().split('.')[0]+"Z";
        proof.creator = `${didElement.did}#primary`;

        let dataToSign = Buffer.from(JSON.stringify(document, null, ""), "utf8").toString("hex").toUpperCase()
        let signature = core.signData(dataToSign, didElement.privateKey);
        proof.signature = signature;
        document.proof = proof;

        return document;
    }

    private sign (didElement, document) {
        let proof = new Proof("ECDSAsecp256r1");
        proof.verificationMethod = `${didElement.did}#primary`;

        let dataToSign = Buffer.from(JSON.stringify(document, null, ""), "utf8").toString("hex").toUpperCase()
        let signature = core.signData(dataToSign, didElement.privateKey);
        proof.signature = signature;
        document.proof = proof;
    }

    private signVp (didElement, document, realm, nonce) {
        let proof = new Proof("ECDSAsecp256r1");
        proof.verificationMethod = `${didElement.did}#primary`;
        proof.realm = realm;
        proof.nonce = nonce;

        let json = JSON.stringify(document, null, "");

        let dataToSign = Buffer.from(json + realm + nonce, "utf8").toString("hex").toUpperCase()
        let signature = this.core.signData(dataToSign, didElement.privateKey);
        proof.signature = signature;
        document.proof = proof;
    }

    private getExpiration (date = new Date(), yearsToAdd = 5) {
        date.setFullYear(date.getFullYear() + yearsToAdd)
        return date
    }

    private getPublicKeyProperty (didElement) {
        return [new DocumentPublicKey(
            `${didElement.did}#primary`,
            "ECDSAsecp256r1",
            didElement.did,
            didElement.publicKeyBase58)];
    }

    public isValid (diddocument, didElement, propertyName = "signatureValue") {

        let document = JSON.parse(JSON.stringify(diddocument));
        delete document.proof;
        let dataToValidate = Buffer.from(JSON.stringify(document, null, ""), "utf8").toString("hex").toUpperCase();

        return core.verifyData(dataToValidate, diddocument["proof"][propertyName], didElement.publicKey);
    }


    public async getMostRecentDIDDocument (did, options = {}) {
        let elastosRPCHost = Constants.elastosRPCAddress.mainchain;
        let useCache =  true;

        if (options && "elastosRPCHost" in options) elastosRPCHost = options["elastosRPCHost"];
        if (options && "useCache" in options) useCache = options["useCache"];
        if (!did) throw new Error("Invalid DID");

        let searchDid = did.replace("did:elastos:", "");

        if (useCache){
            let found = this.searchDIDDocumentOnCache(searchDid);
            if (found) return found;
        }


        let document = await this.searchDIDDocumentOnBlockchain(searchDid, elastosRPCHost);
        if (!document) return undefined;
        if (useCache) this.setDIDDocumentOnCache(searchDid, document);

        return document;
    }

    private setDIDDocumentOnCache (did, diddocument) {
        console.log("Enter on setDIDDocumentOnCache", did, diddocument);
        let storage = window.localStorage; //?? localStorage
        let cache = storage.key["elastos_cache"];
        if (!cache){
            cache = {};
        }

        this.clearExpiredCacheItems(cache);

        cache[did] = {
            "expiration": core.getTimestamp() + (5 * 60),  //Five minutes cache
            "document": diddocument
        }

        console.log("store cache", cache);
        storage.setItem("elastos_cache", JSON.stringify(cache));
    }

    private clearExpiredCacheItems (cache) {
        var keys = Object.keys(cache);
        let timestamp = core.getTimestamp();
        for (var i = 0; i < keys.length; i++) {
            if (timestamp > keys[i]["expiration"]) delete keys[i];
        }
    }

    private async searchDIDDocumentOnBlockchain (did, rpcHost) {

        let responseJson = await core.rpcResolveDID(did, rpcHost);

        if (!responseJson ||
            !responseJson["result"] ||
            !responseJson["result"]["transaction"]) return undefined;

        let lastTransaction = responseJson["result"]["transaction"][0];
        let payload = atob(lastTransaction["operation"]["payload"]);
        return JSON.parse(payload);
    }

    private searchDIDDocumentOnCache (did) {
        let storage = window.localStorage; //?? localStorage
        let cache = storage.getItem("elastos_cache");
        if (!cache) return undefined;
        let jsonCache = JSON.parse(cache);
        let cacheItem = jsonCache[did];
        if (!cacheItem) return undefined;

        let timestamp = core.getTimestamp();

        if (timestamp > cacheItem["expiration"]) return undefined;

        return cacheItem["document"];
    }
}
