// routes/termsRoutes.js
import express from 'express';
const router = express.Router();

// Get Terms of Service
router.get('/terms-of-service', (req, res) => {
  const termsData = {
    title: "Terms of Service - GonBoost",
    lastUpdated: "February 1, 2026",
    effectiveDate: "February 1, 2026",
    content: {
      sections: [
        {
          id: "introduction",
          title: "TERMS OF USE OF SERVICES OF GONBOOST WEBSITE",
          content: `The text of this agreement is a public offer of services. By ordering, buying or using in any way any services provided by the Website, by performing any actions aimed at participating in the Website or fulfilling its conditions, you unconditionally and irrevocably agree to the terms of the public offer described below.

**Website Owner:**
GonBoost Services
Argentina
[Registration pending]

Be sure to read!

Regardless of the actual reading of the text, if you:
1. Create an invoice for payment for the services of the Website, then, in any case, you are considered familiar with the text of this public offer;
2. Pay the bill for services of the Website, you are considered familiar with the text of this public offer and fully and unconditionally accept its terms, and all your opposite statements will be considered null and void;
3. In fact, you do not create and/or pay any bill for the services of the Website, but you do any actions to fulfill the terms of service, you can be admitted as the customer (with the subsequent obligation on your behalf to pay for the services), and you will be bind by rights and obligations according to the text of this offer.

All risks and responsibility for not reading this offer are solely yours. The Website Owners do not bear any responsibility for not familiarizing you with the text of this offer, which is freely available on the Website on the Internet at https://www.gonboost.com/terms-of-service.`
        },
        {
          id: "terminology",
          title: "1. Terminology",
          content: `**1.1. The client:** An individual/legal entity irrespective of sex, race, nationality, language, origin, property and official position, place of residence, attitude to religion, beliefs, membership in public associations, and other circumstances that meet ALL of the following criteria:
- Adequacy
- Good faith
- Full civil and legal capacity
Who is interested and/or applied for the services of the Website.

**1.2. The game:** An interactive computer on-line game, which is a computer program, according to the list of available on the Website.

**1.3. Game account:** An account containing information about the player, his game character and his progress in the game.

**1.4. Game resource:** Game money (gold, coins, etc.), recognized by the rules of the relevant game by the game means of payment or other game conditional unit, which is a measure of one or another game value, progress in the game, etc.

**1.5. Game item:** Game weapons, armor, clothing, artifacts, other things, as well as other individually defined items used in the game.

**1.6. Character boost:** The actions performed according to the rules of the game through appropriate participation in the game, aimed at:
a) Increase in certain game characteristics of the character: the experience, skills, level, abilities, and other qualitative and/or quantitative characteristics of the character of the game - and/or
b) The passage of a game stage/level.

**1.7. The Website:** An Internet site hosted under the domain name www.gonboost.com, as well as all the pages it redirects to.

**1.8. Owners of the Website:** The person who offered this offer – GonBoost Services.

**1.9. Offer (contract):** This proposal containing all the essential terms of the contract for the provision of services of the owners of the Website, and addressed to any person who will respond to it.

**1.10. Acceptance of the offer:** Complete and unconditional, without any exceptions, acceptance by the potential Client of the conditions contained in this offer by performing any actions aimed at the acquisition of the Website services, i.e. agreement to conclude a contract.

**1.11. Personal account (account) of the Client:** An individual section of the Customer on the Website, containing all the necessary materials according to the service chosen by the client, which is entered into by the client using individual credentials (login and password).`
        },
        {
          id: "basic-provisions",
          title: "2. Basic Provisions",
          content: `**2.1.** This public offer is the offer of the Website owners, which is addressed to any and every civil and legal capable individual or legal entity wishing to become a client having the relevant will and intention to conclude an agreement on the conditions set forth below. From the moment of acceptance of this offer, the contract between the owners of the Website and the Client will be deemed to be concluded.

**2.2.** Acceptance of the offer is purely voluntary.

**2.3.** Any circumstances that arise after the acceptance of this offer, which somehow interferes with the receipt of services under the terms of the offer, do not relate to the circumstances of force majeure, are in the customer's responsibility area and are not grounds for unilateral refusal of the client from the contract.

**2.4.** The conclusion of the agreement does not imply any, complete or partial, transfer to the Client of exclusive and other rights, including intellectual property objects belonging to the owners of the Website or to third parties. All materials and information are provided to Clients solely for informational and educational purposes and only for the period of receipt of services, and can not be transferred/sold by the client to any third party without prior permission by the owner of the Website.

**2.5.** The Website owners under no circumstances guarantee and are not responsible for the fact that the result of the received services corresponds or will correspond to the purposes, requirements and expectations of the client, as well as any other person, and the client agrees to the refusal of the responsibility of the Website owners in this regard. Considering the specifics of the services provided and the individual capabilities and characteristics of each character, the Website owners do not bear any responsibility for the lack of a positive effect on the future success of the Client's character in the game process.

**2.6.** In cases when the payment of services was made by a third party (the payer), the owners of the Website are not liable for any financial risks caused by the revealed non-compliance of the client with the requirements set forth in this offer. In all cases, such risks are borne by the payer.

**2.7.** The Website owners are not responsible and under no circumstances will they compensate for any losses incurred or debts of the Customer that have arisen, arise or may arise during the period of its participation in the receipt of services.

**2.8.** Website owners have the right to change the content of this offer unilaterally at any time without any restrictions. The participant is notified about the change to the terms of the offer by publishing a notice on the Website, accessible to all Internet users, and publishing the corresponding revision of the offer. Changes in the offer for earlier concluded and existing contracts shall take effect not earlier than 10 days after the date of publication of the relevant changes (revision) of the offer.

**2.9.** Website owners have the right, without the limitation and consent of the client, to transfer their rights and obligations under the contract, as well as to involve third parties for full or partial fulfillment of their obligations under the agreement, including on issues of payment under the contract, provision of information and consulting materials, etc.

**2.10.** The client must independently monitor the changes in the offer by periodically acquainting itself with the current revision of the offer. The risk of any negative consequences for the client, due to unacknowledged or untimely acquaintance with the current (actual) edition of the offer, is assigned to the client.`
        },
        {
          id: "services-procedures",
          title: "3. Significant Rules and Procedures for Obtaining the Services",
          content: `**3.1. The Services.**
The owner of the Website offers private educational services, which are rules and techniques of character boost, obtaining items, location/map walkthrough, and other related actions. The Services are provided by either individual lessons, or group exercises and game passing.

**3.1.1.** Under no circumstances, we obtain access to your game account, items, or resources. All the tutors/game partners provide the Services using their own game accounts.

**3.2. To obtain the services of the Website, the prospective client must perform the following actions:**
- Read the text of this offer
- On the official Website, choose the services desired for the acquisition
- Create a bill for the payment corresponding to the selected service package
- Pay the billed invoice on time not later than the day preceding the date of the beginning of the provision of the Services
- Properly implement all recommendations submitted

**3.3.** Payment for services is made on-line using payment systems of third parties, such as PayPal, credit cards, and others.

**3.4.** For the duration of the provision of the Services, the Client unconditionally agrees to comply with the requirements of the tutor/game partner designated to such client, to complete tasks that make up an educational process.

**3.5. Owners are required to:**
- After receipt of payment from the client, provide the customer with access to his/her private account
- To provide the client, at his request, with recommendations, advice and other information on obtaining services
- To provide services in due time and in volume in accordance with the order of the client`
        },
        {
          id: "privacy",
          title: "4. Confidentiality. Processing of Personal Data",
          content: `**4.1.** Website owners ensure the confidentiality of the personal data provided to them during the conclusion of the contract, as well as the confidentiality of all data in the personal account/customer account.

**4.2.** After the termination of the of services by the client, Website Owners have the right, at their own discretion, and on the basis of a written request of the client, to remove all the personal data of the client, as well as all data in the client's account from its storages.

**4.3.** The Customer grants to the Website Owners their consent to the unlimited period of storage and processing of their personal data provided to them at the conclusion of the contract, as well as provided to them after receiving the services, in bookkeeping purposes.

**4.4.** Website owners, with the consent of the client, have the right to store personal data of the client on their servers and process such personal data, including for statistical and marketing purposes, as well as for advertising informing the client.

**4.5.** The full privacy policy of the Website is available at https://www.gonboost.com/privacy-policy. By accepting this offer, the client confirms that he is acquainted with the privacy policy and accepts its terms in full.`
        },
        {
          id: "force-majeure",
          title: "5. Circumstances of Force Majeure",
          content: `**5.1.** Website owners and the client are exempt from any responsibility for partial or complete failure to fulfill their obligations arising from the contract if their performance is prevented by extraordinary and insurmountable circumstances.

**5.2.** Under the circumstances of force majeure are deemed, in particular: death/liquidation of the party, earthquakes, fires, floods, other natural disasters, epidemics, accidents, explosions, military actions, as well as legislative changes that entailed the impossibility of fulfilling obligations under the contract.

**5.3.** In case of occurrence of force majeure circumstances for the party to the contract, such a party is obliged to notify the other party immediately after the occurrence of such circumstances. The term of performance of obligations under the contract is prolonged for the period of force majeure circumstances.`
        },
        {
          id: "liability-disputes",
          title: "6. Liability, Dispute Resolution",
          content: `**6.1.** The parties are responsible for failure to perform or for improper performance of obligations under the contract in accordance with the legislation of Argentina and the terms of this offer (concluded agreement).

**6.2.** All disputes and claims that arise on the basis of the concluded contract, or will otherwise be related to its conclusion, execution, modification or termination, both during and after the termination of its validity, are resolved in a pre-trial order, and if it is impossible to settle the dispute peacefully - are subject to hearing in court at the location of the Website Owners in the manner established by the legislation of Argentina.`
        },
        {
          id: "term-offer",
          title: "7. Term of the Offer",
          content: `**7.1.** This offer is valid until its withdrawal by the Website Owners.

**7.2.** The contract concluded as a result of the acceptance of this offer is valid from the moment of its conclusion until its termination.

**7.3.** The moment of the contract conclusion is the moment of acceptance of the offer.

**7.4.** The contract can be terminated:
- As a result of the unilateral refusal of Website Owners for any reason at any time by notifying the client at least 1 (one) calendar day before the termination of the contract
- As a result of the unilateral refusal of the client for any reason at any time by notifying the Website Owners at least 1 (one) calendar day before the termination of the contract
- At any time by agreement between the Parties`
        },
        {
          id: "other-conditions",
          title: "8. Other Conditions",
          content: `**8.1.** All legally significant notices and messages under the agreement are sent by Website Owners and the client to each other, as a general rule, by electronic documents transmitted through communication channels.

**8.2.** Interaction through electronic documents involves sending, receiving and storing legally significant and other information in electronic form using e-mail.

**8.3.** Printed documents from the designated mailboxes, including attachments to them, have the force of properly executed written documents in the absence of the latter.

**8.4.** In the event of a contradiction between a properly executed written document and a document printed out from e-mail, preference is given to a properly executed written document.

**8.5.** Each party is obliged to check every day all the folders of its electronic mailbox, which is considered the main channel of interaction under the contract.

**8.6.** Full or partial assignment of the right of claim by the client under the contract is not allowed under any conditions.

**8.7.** This offer and contract are governed and interpreted in accordance with the laws of Argentina. Questions that are not settled by this offer (concluded by the contract) are subject to resolution in accordance with the legislation of Argentina.`
        }
      ]
    }
  };
  
  res.json(termsData);
});

export default router;