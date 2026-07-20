import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Scale, Mail, Globe, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </Button>
          <div className="bg-[#000080]/10 p-3 rounded-2xl text-[#000080]">
            <Scale size={24} />
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Terms of <span className="text-[#000080]">Service</span></h1>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-foreground/80">EyeField — Marketplace, Echoe Feed, Chat & Calls</p>
              <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">Effective Date: March 30, 2026  |  Version 1.0</p>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12 text-foreground/80 leading-relaxed font-medium">
            <p className="text-lg italic border-l-4 border-accent pl-6 py-2 bg-accent/5 rounded-r-2xl">
              Please read these Terms carefully. By creating an account or using any part of EyeField, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not access or use EyeField.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">1</span> Acceptance of Terms
              </h2>
              <p>
                These Terms of Service (“Terms”) govern your access to and use of the EyeField mobile and web application, including all features such as the marketplace, Echoe social feed, status updates, in-app chat, and voice/video calls (collectively, the “Service”). The Service is operated by EyeField Technologies (“EyeField,” “we,” “our,” or “us”).
              </p>
              <p>
                By registering an account, signing in with Google, or otherwise accessing the Service, you confirm that you are at least 13 years of age, that you have read and understood these Terms, and that you agree to be bound by them. If you are using EyeField on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">2</span> User Accounts
              </h2>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">2.1 Registration</h3>
                  <p>You may register using your email address or via Google Sign-In (OAuth 2.0). You agree to provide accurate, current, and complete information during registration and to keep your account details up to date.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">2.2 Account Security</h3>
                  <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at <span className="text-accent">support@eyefield.pro</span> if you suspect any unauthorised access to your account. EyeField is not liable for losses arising from your failure to secure your account.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">2.3 One Account Per Person</h3>
                  <p>Each person may maintain only one EyeField account. Creating multiple accounts to evade bans or abuse the platform is prohibited and may result in permanent suspension of all associated accounts.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">2.4 Account Termination by You</h3>
                  <p>You may delete your account at any time through the app settings. Upon deletion, your public listings and Echoe posts will be removed within 30 days, and your personal data will be handled as described in our Privacy Policy.</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">3</span> The EyeField Marketplace
              </h2>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">3.1 What EyeField Is</h3>
                  <p>EyeField is a peer-to-peer marketplace platform that enables users to list, discover, and purchase new and used items directly from one another. EyeField acts solely as a technology intermediary and is not a party to any transaction between buyers and sellers.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">3.2 Seller Responsibilities</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>You must accurately describe the condition, specifications, and any defects of items you list.</li>
                    <li>You must have the legal right to sell any item you list.</li>
                    <li>Prices must be stated clearly and honestly.</li>
                    <li>You are responsible for delivering items as agreed with the buyer and for resolving disputes in good faith.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-black text-foreground">3.3 Buyer Responsibilities</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Review listings carefully before initiating contact or making payment.</li>
                    <li>Conduct due diligence; EyeField does not guarantee the quality, safety, or legality of listed items.</li>
                    <li>Payments and delivery arrangements are made directly between you and the seller. EyeField does not process payments or handle escrow at this time.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-black text-foreground">3.4 Prohibited Items</h3>
                  <p className="mb-2">The following items may NOT be listed or sold on EyeField:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Counterfeit, stolen, or fraudulently obtained goods</li>
                    <li>Illegal drugs, controlled substances, or drug paraphernalia</li>
                    <li>Weapons, firearms, ammunition, or explosives</li>
                    <li>Pornographic, obscene, or sexually explicit material</li>
                    <li>Items that infringe intellectual property rights (trademarks, copyrights, patents)</li>
                    <li>Hazardous materials, chemicals, or biological agents</li>
                    <li>Any item whose sale is prohibited under applicable Ugandan or international law</li>
                  </ul>
                  <p className="mt-4 text-sm font-bold text-accent">EyeField reserves the right to remove any listing that violates these rules at any time and without prior notice.</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">4</span> Echoe Feed and Status Updates
              </h2>
              <p>The Echoe page is a social feed where users can post updates, photos, and text content visible to the EyeField community. Status updates are temporary posts visible to your followers or connections.</p>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">4.1 Content Standards</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Content must not be false, misleading, or defamatory.</li>
                    <li>Content must not contain hate speech, harassment, threats, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or nationality.</li>
                    <li>Content must not promote violence, self-harm, or illegal activity.</li>
                    <li>Content must not include nudity, sexually explicit material, or graphic violence.</li>
                    <li>Content must not infringe the intellectual property rights of others.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-black text-foreground">4.2 Ownership and Licence</h3>
                  <p>You retain ownership of the content you post. By posting on EyeField, you grant us a non-exclusive, royalty-free, worldwide licence to display, distribute, and promote your content within the EyeField platform. This licence ends when you delete the content or your account.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">4.3 Content Removal</h3>
                  <p>EyeField may remove any content that violates these Terms or our community guidelines, without notice. Repeated violations may result in account suspension or termination.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">5</span> Chat and Calls
              </h2>
              <p>EyeField provides in-app messaging, voice calls, and video calls to facilitate communication between buyers and sellers. By using these features, you agree that:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You will not use chat or calls to harass, threaten, scam, or defraud other users.</li>
                <li>You will not send spam, unsolicited promotions, or malware links.</li>
                <li>You will not solicit personal financial information (e.g., bank account numbers, passwords) from other users.</li>
                <li>Calls and messages are end-to-end communications between users. EyeField may access message metadata (not content) for safety and fraud prevention purposes as described in our Privacy Policy.</li>
                <li>EyeField does not facilitate or guarantee any transaction negotiated via chat or calls. All agreements are solely between the users involved.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">6</span> Acceptable Use Policy
              </h2>
              <p>You agree not to use EyeField to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Violate any applicable local, national, or international law or regulation</li>
                <li>Impersonate any person, business, or entity, or misrepresent your affiliation with any person or entity</li>
                <li>Scrape, crawl, or harvest data from EyeField without our express written permission</li>
                <li>Attempt to gain unauthorised access to any part of the Service, its servers, or connected systems</li>
                <li>Introduce viruses, malware, or any other harmful code</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Use automated bots or scripts to interact with the Service</li>
                <li>Engage in any activity that places an unreasonable load on our infrastructure</li>
              </ul>
              <p className="text-sm font-bold text-accent">Violation of this policy may result in immediate account termination and, where applicable, reporting to law enforcement.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">7</span> Intellectual Property
              </h2>
              <p>The EyeField name, logo, app design, and all original content created by EyeField Technologies (excluding user-generated content) are the exclusive property of EyeField Technologies and are protected by copyright, trademark, and other intellectual property laws.</p>
              <p>You are granted a limited, non-exclusive, non-transferable, revocable licence to use the Service for its intended purpose. You may not copy, modify, distribute, sell, or create derivative works from any part of the Service without our prior written consent.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">8</span> Third-Party Services
              </h2>
              <p>EyeField integrates third-party services to provide core functionality:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-bold">Google Sign-In (OAuth 2.0):</span> Used for secure account authentication. Your use is subject to Google’s Terms of Service (policies.google.com/terms).</li>
                <li><span className="font-bold">Google Maps Platform:</span> Used to display item locations and enable location-based discovery. Subject to Google Maps Platform Terms of Service.</li>
              </ul>
              <p>EyeField is not responsible for the practices, content, or reliability of third-party services. We encourage you to review the terms of any third-party service you interact with through our platform.</p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">9</span> Disclaimers and Limitation of Liability
              </h2>
              <p className="font-black text-accent uppercase tracking-widest text-sm">IMPORTANT — Please read this section carefully. It limits EyeField’s legal liability to you.</p>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">9.1 No Warranty</h3>
                  <p>The Service is provided “AS IS” and “AS AVAILABLE” without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. EyeField does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">9.2 Marketplace Transactions</h3>
                  <p>EyeField is a platform only. We do not verify the identity of users, the accuracy of listings, the quality of items, or the completion of transactions. You conduct all marketplace transactions at your own risk. EyeField is not liable for any loss, damage, or dispute arising from a transaction between users.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">9.3 Limitation of Liability</h3>
                  <p>To the maximum extent permitted by applicable law, EyeField Technologies and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of (or inability to use) the Service.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">10</span> Indemnification
              </h2>
              <p>You agree to defend, indemnify, and hold harmless EyeField Technologies and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your access to or use of the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including any intellectual property or privacy right; or (d) any content you post, list, or transmit through the Service.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">11</span> Termination
              </h2>
              <p>EyeField may suspend or terminate your account and access to the Service at any time, with or without notice, for any reason, including but not limited to a breach of these Terms. Upon termination:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your right to access and use the Service ceases immediately.</li>
                <li>Your active listings will be removed.</li>
                <li>Data retention will follow our Privacy Policy.</li>
              </ul>
              <p>Termination does not limit any other remedies EyeField may have at law or in equity. Provisions of these Terms that by their nature should survive termination (including Sections 7, 9, 10, and 13) will survive.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">12</span> Modifications to the Service and Terms
              </h2>
              <p>EyeField reserves the right to modify, suspend, or discontinue any part of the Service at any time without liability. We may also update these Terms from time to time. When we make material changes, we will notify you via in-app notification or email and update the “Effective Date” at the top of this document.</p>
              <p>Your continued use of the Service after updated Terms take effect constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and delete your account.</p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">13</span> Governing Law and Dispute Resolution
              </h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of Uganda, without regard to its conflict of law principles.</p>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">13.1 Informal Resolution</h3>
                  <p>Before initiating any formal legal proceeding, you agree to contact EyeField at <span className="text-accent">support@eyefield.pro</span> and attempt to resolve the dispute informally. We will make reasonable efforts to resolve disputes within 30 days of receiving notice.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">13.2 Arbitration</h3>
                  <p>If the dispute cannot be resolved informally, both parties agree to submit the dispute to binding arbitration under the rules applicable in Uganda, rather than litigating in court, except where prohibited by law.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">13.3 Class Action Waiver</h3>
                  <p>You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">14</span> General Provisions
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-bold text-foreground">Entire Agreement:</span> These Terms and our Privacy Policy constitute the entire agreement between you and EyeField regarding the Service.</li>
                <li><span className="font-bold text-foreground">Severability:</span> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</li>
                <li><span className="font-bold text-foreground">Waiver:</span> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</li>
                <li><span className="font-bold text-foreground">Assignment:</span> You may not assign or transfer these Terms without our prior written consent. EyeField may assign these Terms without restriction.</li>
                <li><span className="font-bold text-foreground">No Partnership:</span> Nothing in these Terms creates any partnership, joint venture, agency, franchise, or employment relationship between you and EyeField.</li>
              </ul>
            </section>

            <section className="space-y-6 bg-secondary/20 p-8 rounded-[2.5rem] border border-white/5">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">15</span> Contact Us
              </h2>
              <p>For questions about these Terms of Service, please contact us:</p>
              <div className="grid gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal / Terms Enquiries</p>
                    <p className="font-bold">support@eyefield.pro</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</p>
                    <a href="https://eyefield.pro" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-accent transition-colors">https://eyefield.pro</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</p>
                    <p className="font-bold">EyeField Technologies, Kampala, Uganda</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-accent">16</span> Music Copyright Policy
              </h2>
              <div className="space-y-4 pl-4">
                <p>
                  EyeField respects the intellectual property rights of others and expects our users to do the same. When using audio or music in your Echoe posts or status updates, you must ensure that you have the necessary rights or permissions to use such content.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="font-bold text-foreground">Copyrighted Material:</span> You may not upload or use music that you do not own or have a valid licence for, unless your use falls under a legal exception (such as fair use).</li>
                  <li><span className="font-bold text-foreground">Royalties:</span> You are solely responsible for any royalties, fees, or other monies owed to any person or entity by reason of music you post on EyeField.</li>
                  <li><span className="font-bold text-foreground">Infringement Claims:</span> If we receive a valid copyright infringement notice regarding music in your content, we will remove the content in accordance with applicable laws and may suspend or terminate your account for repeat violations.</li>
                  <li><span className="font-bold text-foreground">Legal Compliance:</span> Users are encouraged to use royalty-free music or content they have created themselves to avoid copyright complications.</li>
                </ul>
              </div>
            </section>
          </div>

          <footer className="pt-12 border-t border-white/5 text-center space-y-2">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              © 2026 EyeField Technologies. All rights reserved.
            </p>
            <a href="https://eyefield.pro/terms" className="text-[10px] font-bold text-accent hover:underline">https://eyefield.pro/terms</a>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;