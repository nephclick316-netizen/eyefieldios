import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Mail, Globe, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </Button>
          <div className="bg-[#000080]/10 p-3 rounded-2xl text-[#000080]">
            <Shield size={24} />
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Privacy <span className="text-[#000080]">Policy</span></h1>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-foreground/80">EyeField — Marketplace, Echoe Feed, Chat & Calls</p>
              <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest">Effective Date: March 30, 2026  |  Version 1.0</p>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12 text-foreground/80 leading-relaxed font-medium">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">1</span> Introduction
              </h2>
              <p>
                Welcome to EyeField (“we,” “our,” or “us”). EyeField is an e-commerce platform that lets users buy and sell new and used items, post updates on our social feed called Echoe, share status updates, and communicate directly with other users through in-app chat and calls.
              </p>
              <p>
                This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and the rights you have over your data. By using EyeField, you agree to the practices described below. If you do not agree, please discontinue use of the app.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">2</span> Information Collection
              </h2>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">2.1 Information You Provide</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Full name and display name</li>
                    <li>Email address (via Google Sign-In or direct registration)</li>
                    <li>Profile photo</li>
                    <li>Product listings: titles, descriptions, prices, and photos of items you sell</li>
                    <li>Echoe feed posts, status updates, and captions you publish</li>
                    <li>Messages, voice calls, and video call data sent through our chat system</li>
                    <li>Contact details you voluntarily share with buyers or sellers</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-black text-foreground">2.2 Information Collected Automatically</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Device identifiers and operating system version</li>
                    <li>IP address and approximate location (for fraud prevention)</li>
                    <li>Precise location data (GPS) — only when you grant permission — used to show nearby listings and sellers on the map</li>
                    <li>Usage data: pages visited, features used, time spent, and actions taken</li>
                    <li>Log data: crash reports, error logs, and performance diagnostics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-black text-foreground">2.3 Information from Google Services</h3>
                  <p>When you sign in with Google, we receive the following data from Google in accordance with OAuth 2.0 scopes you authorise:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your Google account name and email address</li>
                    <li>Your Google profile picture</li>
                  </ul>
                  <p className="mt-2">We do not receive or store your Google password. We do not access Gmail, Google Drive, Google Contacts, or any other Google service beyond what is listed above.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">3</span> How We Use Your Information
              </h2>
              <p>We use your personal data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage your EyeField account</li>
                <li>Display your listings and profile to other users</li>
                <li>Enable you to post on Echoe, share status updates, and interact with other users' posts</li>
                <li>Facilitate direct messaging, voice calls, and video calls between buyers and sellers</li>
                <li>Show your location (with consent) on Google Maps to help buyers find nearby items</li>
                <li>Send transactional notifications (e.g., new message alerts, listing activity)</li>
                <li>Detect and prevent fraud, spam, and prohibited content</li>
                <li>Comply with applicable laws and enforce our Terms of Service</li>
                <li>Improve app performance, fix bugs, and develop new features</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">4</span> Google Sign-In and Data Usage
              </h2>
              <p>EyeField uses Google Sign-In (OAuth 2.0) as an authentication method. When you choose to sign in with Google:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You are redirected to Google's secure login page. EyeField never sees your Google password.</li>
                <li>We request only the minimum OAuth scopes required: openid, email, and profile.</li>
                <li>The access token issued by Google is used solely to verify your identity and populate your EyeField profile.</li>
                <li>You can revoke EyeField's access to your Google account at any time via myaccount.google.com/permissions.</li>
              </ul>
              <p>Our use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not use Google user data for advertising, profiling, or any purpose beyond operating the EyeField service.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">5</span> Location Data and Google Maps
              </h2>
              <p>EyeField integrates the Google Maps API to display item locations and help buyers discover sellers near them. Location data is used as follows:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Precise GPS location is collected only when you explicitly grant location permission on your device.</li>
                <li>Your location is used to pin your listings on the map and to show you nearby listings from other sellers.</li>
                <li>Location data is transmitted securely and stored only as long as needed to support the above features.</li>
                <li>You can withdraw location permission at any time through your device settings. Listings will then display without a precise location pin.</li>
              </ul>
              <p>Map rendering is powered by the Google Maps Platform. Google's own privacy policy governs data processed by their mapping services: policies.google.com/privacy.</p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">6</span> Data Sharing and Disclosure
              </h2>
              <p>We do not sell your personal data. We share data only in the following circumstances:</p>
              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-black text-foreground">6.1 With Other Users</h3>
                  <p>Your public profile (name, photo, listings, Echoe posts, and status updates) is visible to other EyeField users. Messages and call history are visible only to you and the other party in the conversation.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">6.2 Service Providers</h3>
                  <p>We work with trusted third-party vendors who process data on our behalf (e.g., cloud hosting, push notifications, analytics). These vendors are contractually bound to use your data only for the services they provide to us.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">6.3 Google</h3>
                  <p>Authentication and mapping services are provided by Google LLC. Data shared with Google is governed by Google's Privacy Policy.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">6.4 Legal Requirements</h3>
                  <p>We may disclose your data if required to do so by law, court order, or governmental authority, or if we believe disclosure is necessary to protect the rights, property, or safety of EyeField, our users, or the public.</p>
                </div>
                <div>
                  <h3 className="font-black text-foreground">6.5 Business Transfers</h3>
                  <p>In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, subject to the same privacy protections described in this policy.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">7</span> Data Retention
              </h2>
              <p>We retain your personal data for as long as your account is active or as needed to provide our services.</p>
              <p>Specifically:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account data is retained until you delete your account.</li>
                <li>Chat messages and call logs are retained for 12 months, then automatically deleted.</li>
                <li>Location data is retained only for the session and is not stored long-term.</li>
                <li>Log and diagnostic data is retained for up to 90 days.</li>
              </ul>
              <p>After account deletion, residual data may remain in encrypted backups for up to 30 days before being permanently purged.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">8</span> Data Security
              </h2>
              <p>We implement industry-standard security measures to protect your data, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>HTTPS / TLS encryption for all data in transit</li>
                <li>Encrypted storage of sensitive data at rest</li>
                <li>OAuth 2.0 for secure, password-free authentication via Google</li>
                <li>Regular security audits and vulnerability assessments</li>
              </ul>
              <p>No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. We encourage you to use a strong, unique password if you create a native account and to keep your Google account secure.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">9</span> Your Rights and Choices
              </h2>
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access: Request a copy of the personal data we hold about you.</li>
                <li>Correction: Ask us to correct inaccurate or incomplete data.</li>
                <li>Deletion: Request deletion of your account and associated data.</li>
                <li>Portability: Receive your data in a structured, machine-readable format.</li>
                <li>Objection / Restriction: Object to or restrict certain processing of your data.</li>
                <li>Withdraw Consent: Withdraw consent to location access or other permissions at any time via your device settings.</li>
              </ul>
              <p>To exercise any of these rights, contact us at <span className="text-[#000080] font-bold">privacy@eyefield.pro</span>. We will respond within 30 days.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">10</span> Children's Privacy
              </h2>
              <p>EyeField is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will delete it promptly. If you believe a child has created an account, please contact us at <span className="text-[#000080] font-bold">privacy@eyefield.pro</span>.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">11</span> Third-Party Links
              </h2>
              <p>EyeField may contain links to third-party websites or services. This Privacy Policy applies solely to EyeField. We are not responsible for the privacy practices of third-party sites. We encourage you to review the privacy policies of any third-party services you access through our platform.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">12</span> Changes to This Policy
              </h2>
              <p>We may update this Privacy Policy from time to time. When we do, we will revise the “Effective Date” at the top of this document and, where the changes are material, notify you via in-app notification or email. Continued use of EyeField after the updated policy takes effect constitutes your acceptance of the revised terms.</p>
            </section>

            <section className="space-y-6 bg-secondary/20 p-8 rounded-[2.5rem] border border-white/5">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                <span className="text-[#000080]">13</span> Contact Us
              </h2>
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              <div className="grid gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
                    <p className="font-bold">support@eyefield.pro</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#000080]/10 flex items-center justify-center text-[#000080]">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</p>
                    <a href="https://eyefield.pro" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-[#000080] transition-colors">https://eyefield.pro</a>
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

            <section className="space-y-4 bg-[#000080]/5 p-6 rounded-2xl border border-[#000080]/10">
              <h3 className="font-black text-[#000080] uppercase tracking-widest text-xs">Google API Services — Limited Use Disclosure</h3>
              <p className="text-sm">EyeField's use of information received from Google APIs (including Google Sign-In and Google Maps) adheres to the Google API Services User Data Policy, including its Limited Use requirements. Data obtained from Google is used solely to authenticate users and display map content within EyeField. It is not used for advertising, sold to third parties, or shared for purposes unrelated to app functionality.</p>
            </section>
          </div>

          <footer className="pt-12 border-t border-white/5 text-center space-y-2">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              © 2026 EyeField Technologies. All rights reserved.
            </p>
            <a href="https://eyefield.pro/privacy" className="text-[10px] font-bold text-[#000080] hover:underline">https://eyefield.pro/privacy</a>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;