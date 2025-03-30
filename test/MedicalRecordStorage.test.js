const MedicalRecordStorage = artifacts.require("MedicalRecordStorage");

contract("MedicalRecordStorage", accounts => {
    let medicalRecordStorage;
    const [owner, doctor, patient, director, healthAuthority] = accounts;

    beforeEach(async () => {
        medicalRecordStorage = await MedicalRecordStorage.new();
    });

    describe("Participant Management", () => {
        it("should register a doctor", async () => {
            await medicalRecordStorage.setParticipant(
                doctor,
                "Dr. Smith",
                "Hospital A",
                "1234567890",
                "DOCTOR",
                true
            );

            const participant = await medicalRecordStorage.participants(doctor);
            assert.equal(participant.name, "Dr. Smith");
            assert.equal(participant.role, "DOCTOR");
            assert.equal(participant.isActive, true);
        });

        it("should register a patient", async () => {
            await medicalRecordStorage.setParticipant(
                patient,
                "John Doe",
                "Address 123",
                "0987654321",
                "PATIENT",
                true
            );

            const participant = await medicalRecordStorage.participants(patient);
            assert.equal(participant.name, "John Doe");
            assert.equal(participant.role, "PATIENT");
            assert.equal(participant.isActive, true);
        });

        it("should register a director", async () => {
            await medicalRecordStorage.setParticipant(
                director,
                "Director Johnson",
                "Hospital A",
                "1122334455",
                "DIRECTOR",
                true
            );

            const participant = await medicalRecordStorage.participants(director);
            assert.equal(participant.name, "Director Johnson");
            assert.equal(participant.role, "DIRECTOR");
            assert.equal(participant.isActive, true);
        });

        it("should register a health authority", async () => {
            await medicalRecordStorage.setParticipant(
                healthAuthority,
                "Health Authority",
                "Government Office",
                "5544332211",
                "HEALTH_AUTHORITY",
                true
            );

            const participant = await medicalRecordStorage.participants(healthAuthority);
            assert.equal(participant.name, "Health Authority");
            assert.equal(participant.role, "HEALTH_AUTHORITY");
            assert.equal(participant.isActive, true);
        });
    });

    describe("Medical Record Management", () => {
        beforeEach(async () => {
            // Register all participants first
            await medicalRecordStorage.setParticipant(doctor, "Dr. Smith", "Hospital A", "1234567890", "DOCTOR", true);
            await medicalRecordStorage.setParticipant(patient, "John Doe", "Address 123", "0987654321", "PATIENT", true);
            await medicalRecordStorage.setParticipant(director, "Director Johnson", "Hospital A", "1122334455", "DIRECTOR", true);
            await medicalRecordStorage.setParticipant(healthAuthority, "Health Authority", "Government Office", "5544332211", "HEALTH_AUTHORITY", true);
        });

        it("should create a medical record", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });

            const recordBasic = await medicalRecordStorage.medicalRecordsBasic(1);
            assert.equal(recordBasic.patientAddress, patient);
            assert.equal(recordBasic.doctorAddress, doctor);
            assert.equal(recordBasic.diagnosis, "Common cold");
            assert.equal(recordBasic.status, 0); // Created status
        });

        it("should not allow non-doctor to create medical record", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            try {
                await medicalRecordStorage.createMedicalRecord(part1, part2, { from: patient });
                assert.fail("Should have thrown an error");
            } catch (err) {
                assert.include(err.message, "Chi cho phep DOCTOR");
            }
        });

        it("should approve medical record by doctor", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });
            await medicalRecordStorage.approveMedicalRecordByDoctor(1, { from: doctor });

            const recordBasic = await medicalRecordStorage.medicalRecordsBasic(1);
            assert.equal(recordBasic.status, 1); // ApprovedByDoctor status
        });

        it("should approve medical record by director", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });
            await medicalRecordStorage.approveMedicalRecordByDoctor(1, { from: doctor });
            await medicalRecordStorage.approveMedicalRecordByDirector(1, { from: director });

            const recordBasic = await medicalRecordStorage.medicalRecordsBasic(1);
            assert.equal(recordBasic.status, 2); // ApprovedByDirector status
        });

        it("should approve medical record by health authority", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });
            await medicalRecordStorage.approveMedicalRecordByDoctor(1, { from: doctor });
            await medicalRecordStorage.approveMedicalRecordByDirector(1, { from: director });
            await medicalRecordStorage.approveMedicalRecordByHealthAuthority(1, { from: healthAuthority });

            const recordBasic = await medicalRecordStorage.medicalRecordsBasic(1);
            assert.equal(recordBasic.status, 3); // ApprovedByHealthAuthority status
        });

        it("should allow patient to view their medical record", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });

            const result = await medicalRecordStorage.getMedicalRecord(1, { from: patient });
            const recordBasic = result[0];
            const recordExtended = result[1];
            
            assert.equal(recordBasic.patientAddress, patient);
            assert.equal(recordBasic.diagnosis, "Common cold");
            assert.equal(recordExtended.medicalHistory, "No previous history");
            assert.equal(recordExtended.allergies, "None");
        });

        it("should not allow non-patient to view medical record", async () => {
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });

            try {
                await medicalRecordStorage.getMedicalRecord(1, { from: doctor });
                assert.fail("Should have thrown an error");
            } catch (err) {
                assert.include(err.message, "Ban khong co quyen truy cap ho so nay");
            }
        });
    });

    describe("Medical Image Management", () => {
        beforeEach(async () => {
            // Register doctor and patient
            await medicalRecordStorage.setParticipant(doctor, "Dr. Smith", "Hospital A", "1234567890", "DOCTOR", true);
            await medicalRecordStorage.setParticipant(patient, "John Doe", "Address 123", "0987654321", "PATIENT", true);

            // Create a medical record
            const part1 = {
                patientAddress: patient,
                diagnosis: "Common cold",
                treatment: "Rest and medication",
                createdDate: "2024-01-14",
                symptoms: "Fever, cough"
            };

            const part2 = {
                medicalHistory: "No previous history",
                allergies: "None",
                medications: "Paracetamol",
                labResults: "Normal",
                vitals: "BP: 120/80, Temp: 37.5",
                followUpPlan: "Follow up in 1 week"
            };

            await medicalRecordStorage.createMedicalRecord(part1, part2, { from: doctor });
        });

        it("should add medical image to record", async () => {
            await medicalRecordStorage.addMedicalImage(
                1,
                "ipfs://QmTest123",
                "0x123456789",
                "X-ray",
                "Chest X-ray showing normal results",
                { from: doctor }
            );

            const images = await medicalRecordStorage.getMedicalImages(1, { from: doctor });
            assert.equal(images.length, 1);
            assert.equal(images[0].imageType, "X-ray");
            assert.equal(images[0].imageUrl, "ipfs://QmTest123");
        });

        it("should not allow non-doctor to add medical image", async () => {
            try {
                await medicalRecordStorage.addMedicalImage(
                    1,
                    "ipfs://QmTest123",
                    "0x123456789",
                    "X-ray",
                    "Chest X-ray showing normal results",
                    { from: patient }
                );
                assert.fail("Should have thrown an error");
            } catch (err) {
                assert.include(err.message, "Chi bac si tao ho so moi co the them hinh anh");
            }
        });

        it("should allow patient to view their medical images", async () => {
            // Add image first
            await medicalRecordStorage.addMedicalImage(
                1,
                "ipfs://QmTest123",
                "0x123456789",
                "X-ray",
                "Chest X-ray showing normal results",
                { from: doctor }
            );

            const images = await medicalRecordStorage.getMedicalImages(1, { from: patient });
            assert.equal(images.length, 1);
            assert.equal(images[0].imageType, "X-ray");
        });
    });
});