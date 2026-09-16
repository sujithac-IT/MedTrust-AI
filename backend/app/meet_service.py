import uuid
import random
import string
import urllib.parse
from typing import Dict, Any, List

def generate_meet_code() -> str:
    """Generates a realistic 3-segment Google Meet code: xxx-yyyy-zzz"""
    chars = string.ascii_lowercase
    p1 = "".join(random.choices(chars, k=3))
    p2 = "".join(random.choices(chars, k=4))
    p3 = "".join(random.choices(chars, k=3))
    return f"{p1}-{p2}-{p3}"

def generate_meet_space() -> Dict[str, str]:
    """Generates a Google Meet Space URI, Meet Code, direct Meet URL, and Calendar Event Link."""
    code = generate_meet_code()
    space_id = f"spaces/mt-{uuid.uuid4().hex[:8]}"
    meet_url = f"https://meet.google.com/{code}"
    
    # Calendar template link
    title = "MedTrust AI Clinical Telehealth Consultation"
    details = f"Consultation on MedTrust AI Clinical Telehealth Platform.\nGoogle Meet Space: {space_id}\nDirect Meet URL: {meet_url}\nDoctor & Student Telehealth Room."
    location = meet_url
    
    cal_url = (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={urllib.parse.quote(title)}"
        f"&details={urllib.parse.quote(details)}"
        f"&location={urllib.parse.quote(location)}"
    )
    
    return {
        "meet_space": space_id,
        "meet_code": code,
        "meet_url": meet_url,
        "calendar_link": cal_url
    }

CLINICAL_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "cardiology": {
        "title": "Cardiology: Exertional Angina & ACE-Inhibitor Cough",
        "patient_id": "pat-1",
        "chief_complaint": "Retrosternal chest tightness on walking and persistent dry hacking cough for 3 weeks",
        "transcript": [
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "10:02:15",
                "text": "Good morning Mr. Sundaram. I am Dr. Rajesh Sharma, and with me is Sneha Patel, our final-year MBBS intern. How are you feeling today?",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "10:02:30",
                "text": "Good morning Doctor. For the past three weeks, whenever I climb the stairs or walk briskly to the temple, I feel a heavy squeezing tightness in the center of my chest. It goes away when I sit and rest for five minutes.",
                "confidence": 0.98
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "10:02:55",
                "text": "Mr. Sundaram, does this chest pressure radiate down your left arm, throat, or into your jaw? And are you sweating or breathless during these episodes?",
                "confidence": 0.97
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "10:03:15",
                "text": "Yes Sneha, it radiates slightly to my left shoulder and inner arm. No vomiting, but I feel slight breathlessness. Also Doctor, I have had this continuous dry, irritating cough for the last one month with no phlegm, which disturbs my sleep.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "10:03:40",
                "text": "Let's review your medications. You are currently taking Enalapril 10mg once daily for high blood pressure, and Metformin 500mg twice daily for diabetes. Did the dry cough begin shortly after Enalapril was started?",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "10:04:02",
                "text": "Exactly Doctor! About two weeks after starting that new BP tablet, the tickling dry cough began. Also, my blood pressure reading this morning was 152 over 94, and pulse was 84 beats per minute.",
                "confidence": 0.97
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "10:04:30",
                "text": "This is classic ACE-inhibitor induced bradykinin-mediated cough. We must stop Enalapril immediately. We will switch you to an Angiotensin Receptor Blocker: Telmisartan 40mg once daily in the morning. For your exertional chest tightness, this presents as Class II Stable Angina Pectoris.",
                "confidence": 0.99
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "10:04:58",
                "text": "Doctor, should we prescribe sublingual Sorbitrate 5mg SOS for acute episodes, along with starting Aspirin 75mg and Atorvastatin 20mg daily?",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "10:05:25",
                "text": "Very good, Sneha. Exactly. Tablet Sorbitrate 5mg under the tongue if chest discomfort occurs and does not relieve within 3 minutes. Stop physical exertion immediately. If chest pain lasts longer than 15 minutes or is accompanied by cold sweating, proceed immediately to the nearest Emergency Department. We need a 12-lead ECG, 2D-Echocardiogram, and a Treadmill Stress Test (TMT) within 48 hours.",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "10:05:50",
                "text": "Thank you Doctor. Remember I have a known allergy to Penicillin, so please ensure none of the prescribed medicines contain that.",
                "confidence": 0.99
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "10:06:05",
                "text": "Noted Mr. Sundaram. None of your cardiovascular medications are beta-lactams. We will review your ECG and Echo in 1 week.",
                "confidence": 0.99
            }
        ]
    },
    "endocrinology": {
        "title": "Endocrinology: Uncontrolled Type 2 Diabetes & Peripheral Neuropathy",
        "patient_id": "pat-1",
        "chief_complaint": "Bilateral burning sensation in feet, increased thirst, and frequent night urination",
        "transcript": [
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "11:15:00",
                "text": "Hello Mr. Sundaram. Let us check on your diabetes management. What are your recent blood sugar readings?",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "11:15:20",
                "text": "Doctor, my fasting blood glucose yesterday morning was 188 mg/dL, and post-prandial was 280 mg/dL. Also for the past month, both my soles have intense tingling and burning sensations, especially when I lay down at night.",
                "confidence": 0.98
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "11:15:45",
                "text": "Are you experiencing any numbness or tingling in your hands, or any foot ulcers or calluses? What is your recent HbA1c?",
                "confidence": 0.97
            },
            {
                "speaker": "patient",
                "speaker_name": "K. Sundaram",
                "timestamp": "11:16:05",
                "text": "No ulcers on the feet yet, thank God. My last HbA1c done last week was 9.4%. I am currently on Metformin 500mg twice a day.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "11:16:30",
                "text": "An HbA1c of 9.4% indicates chronic poor glycemic control. The bilateral burning dysesthesia in a glove-and-stocking distribution is classic Diabetic Peripheral Neuropathy. We need to optimize your antidiabetic regimen.",
                "confidence": 0.99
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "11:16:55",
                "text": "Should we increase Metformin to 1000mg twice daily with meals and add an SGLT-2 inhibitor like Dapagliflozin 10mg daily? For the neuropathic pain, Pregabalin 75mg at bedtime.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "11:17:25",
                "text": "Excellent plan, Sneha. We will also order serum creatinine, urine microalbumin-to-creatinine ratio, and a dilated fundus eye exam. Mr. Sundaram, inspect your feet daily with a mirror and never walk barefoot.",
                "confidence": 0.99
            }
        ]
    },
    "pediatrics": {
        "title": "Pediatrics: Acute Wheezing Bronchitis & Childhood Asthma",
        "patient_id": "pat-3",
        "chief_complaint": "6-year-old child with nocturnal dry cough, whistling sound in chest, and mild breathlessness",
        "transcript": [
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "14:10:00",
                "text": "Good afternoon Mrs. Sharma. How is young Aarav doing? What symptoms brought you to the clinic today?",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "Parent of Aarav Sharma",
                "timestamp": "14:10:20",
                "text": "Doctor, for the past four days Aarav has had a runny nose and dry cough that gets much worse at night around 3 AM. Last night we could hear a clear high-pitched whistling sound when he breathes out.",
                "confidence": 0.98
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "14:10:48",
                "text": "Has Aarav had high fever? And are you noticing any sucking in of the skin under his ribs or at his neck when he breathes?",
                "confidence": 0.97
            },
            {
                "speaker": "patient",
                "speaker_name": "Parent of Aarav Sharma",
                "timestamp": "14:11:10",
                "text": "Temperature was 99.4°F yesterday, no high fever. He is breathing a bit fast, rate is around 28 breaths per minute, but he is still drinking fluids and speaking in full sentences.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "14:11:35",
                "text": "This clinical presentation is characteristic of an acute asthma exacerbation triggered by a viral upper respiratory tract infection. Oxygen saturation at room air is 96%. We will start him on bronchodilator therapy with a spacer.",
                "confidence": 0.99
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "14:12:00",
                "text": "We will prescribe Levosalbutamol inhaler 50mcg 2 puffs via pediatric spacer with mask every 4 to 6 hours as needed, combined with Budesonide 100mcg inhaler 1 puff twice daily.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "14:12:30",
                "text": "Make sure to rinse the child's mouth with water after Budesonide inhalation to prevent oral thrush. Red flags: if you see deep chest indrawing, grunting, blue lips, or inability to speak, bring him to the ER immediately.",
                "confidence": 0.99
            }
        ]
    },
    "gastroenterology": {
        "title": "Gastroenterology: NSAID-Induced Peptic Dyspepsia & GERD",
        "patient_id": "pat-4",
        "chief_complaint": "Severe burning epigastric pain, acid regurgitation, and nausea after taking Ibuprofen",
        "transcript": [
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "16:00:10",
                "text": "Good afternoon Mr. Rameshwar Rao. What has been troubling your stomach?",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "Rameshwar Rao",
                "timestamp": "16:00:30",
                "text": "Doctor, for two weeks my knee osteoarthritis was very painful, so I took Ibuprofen 400mg twice a day from the pharmacy without doctor's advice. Now I have terrible gnawing, burning pain in the upper middle of my stomach.",
                "confidence": 0.98
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "16:00:55",
                "text": "Mr. Rao, is the pain worse before food or after food? Have you noticed any black tarry stools or vomiting blood?",
                "confidence": 0.98
            },
            {
                "speaker": "patient",
                "speaker_name": "Rameshwar Rao",
                "timestamp": "16:01:18",
                "text": "No black stools or vomiting, but the burning gets worse 2 hours after meals and at midnight. Bitter sour fluid keeps rising into my throat.",
                "confidence": 0.97
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "16:01:45",
                "text": "Non-steroidal anti-inflammatory drugs like Ibuprofen inhibit gastric mucosal prostaglandins and cause acute peptic gastritis or ulceration. We must stop all NSAIDs immediately.",
                "confidence": 0.99
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "16:02:10",
                "text": "We will switch analgesia for knee pain to Paracetamol 650mg SOS, and start Capsule Esomeprazole 40mg once daily 30 minutes before breakfast for 4 weeks.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "16:02:40",
                "text": "Also add Sucralfate suspension 10ml thrice daily 1 hour before meals as a mucosal barrier coat. We will arrange an H. pylori stool antigen test. Avoid spicy foods, caffeine, and late night meals.",
                "confidence": 0.99
            }
        ]
    },
    "psychiatry": {
        "title": "Psychiatry: Generalized Anxiety Disorder & Somatic Palpitations",
        "patient_id": "pat-2",
        "chief_complaint": "Persistent worry, racing heartbeat, tension headaches, and severe initial insomnia",
        "transcript": [
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "17:20:00",
                "text": "Hello Ms. Ananya. Thank you for connecting with us today. Please tell us what you have been experiencing.",
                "confidence": 0.99
            },
            {
                "speaker": "patient",
                "speaker_name": "Ananya Sen",
                "timestamp": "17:20:22",
                "text": "Doctor, for the past three months I feel constantly on edge. My mind races with excessive worry over work and family. My heart suddenly thumps rapidly in my chest, my hands tremble, and it takes me 2 to 3 hours to fall asleep every night.",
                "confidence": 0.98
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "17:20:50",
                "text": "Have you noticed any unintentional weight loss, heat intolerance, or menstrual irregularities? And have you had any thoughts of self-harm?",
                "confidence": 0.97
            },
            {
                "speaker": "patient",
                "speaker_name": "Ananya Sen",
                "timestamp": "17:21:10",
                "text": "No weight loss or thoughts of harming myself at all. I just feel mentally exhausted and tense. My thyroid tests done last month were completely normal.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "17:21:35",
                "text": "Your symptoms meet the criteria for Generalized Anxiety Disorder (GAD) with autonomic hyperarousal. Blood pressure is 118/76, ECG is normal sinus rhythm at 88 bpm. We will formulate a comprehensive management plan including pharmacotherapy and cognitive behavioral therapy (CBT).",
                "confidence": 0.99
            },
            {
                "speaker": "student",
                "speaker_name": "Sneha Patel (Intern)",
                "timestamp": "17:22:00",
                "text": "We can initiate Tablet Escitalopram 5mg once daily in the morning for 1 week, then titrate to 10mg daily. Tablet Clonazepam 0.25mg at night for 10 days only as a short-term bridge for sleep.",
                "confidence": 0.98
            },
            {
                "speaker": "doctor",
                "speaker_name": "Dr. Rajesh Sharma, MD",
                "timestamp": "17:22:30",
                "text": "Agreed. We will also refer you to our hospital clinical psychologist for structured CBT and sleep hygiene coaching. Review in 2 weeks to monitor tolerability.",
                "confidence": 0.99
            }
        ]
    }
}
