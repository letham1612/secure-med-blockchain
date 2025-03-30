import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom'
import DoctorML from './DoctorML';

const Doctor = ({mediChain, account}) => {
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [disease, setDisease] = useState('');
  const [treatment, setTreatment] = useState('');
  const [charges, setCharges] = useState('');
  const [patList, setPatList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [transactionsList, setTransactionsList] = useState([]);

  const getDoctorData = async () => {
    var doctor = await mediChain.methods.doctorInfo(account).call();
    setDoctor(doctor);
  }
  const getPatientAccessList = async () => {
    var pat = await mediChain.methods.getDoctorPatientList(account).call();
    let pt = []
    for(let i=0; i<pat.length; i++){
      let patient = await mediChain.methods.patientInfo(pat[i]).call();
      patient = { ...patient, account:pat[i] }
      pt = [...pt, patient]
    }
    setPatList(pt);
  }
  const getTransactionsList = async () => {
    var transactionsIdList = await mediChain.methods.getDoctorTransactions(account).call();
    let tr = [];
    for(let i=transactionsIdList.length-1; i>=0; i--){
        let transaction = await mediChain.methods.transactions(transactionsIdList[i]).call();
        let sender = await mediChain.methods.patientInfo(transaction.sender).call();
        if(!sender.exists) sender = await mediChain.methods.insurerInfo(transaction.sender).call();
        transaction = {...transaction, id: transactionsIdList[i], senderEmail: sender.email}
        tr = [...tr, transaction];
    }
    setTransactionsList(tr);
  }

  const handleCloseModal = () => setShowModal(false);
  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowModal = async (patient) => {
    await setPatient(patient);
    await setShowModal(true);
  }
  const handleShowRecordModal = async (patient) => {
    try {
        if (!patient || !patient.account) {
            console.error("Invalid patient data:", patient);
            return;
        }
        console.log("Fetching record for patient:", patient.account);
        var record = await mediChain.methods.getPatientRecord(patient.account).call();
        console.log("Raw record:", record);

        let treatments = [];
        let symptoms = {
            fever: false,
            cough: false,
            fatigue: false,
            breathing: false,
            headache: false,
            throat: false,
            chest: false,
            bodyPain: false
        };
        let vitals = {
            temperature: '',
            heartRate: '',
            oxygenLevel: '',
            bloodPressure: ''
        };

        // Parse the record if it's a JSON string
        try {
            if (typeof record === 'string' && record) {
                const recordData = JSON.parse(record);
                // If the record is a single treatment
                if (recordData.disease && recordData.treatment) {
                    treatments = [recordData];
                }
                // If the record contains an array of treatments
                else if (Array.isArray(recordData)) {
                    treatments = recordData;
                }
                // If the record has a treatments array
                else if (recordData.treatments && Array.isArray(recordData.treatments)) {
                    treatments = recordData.treatments;
                }

                // Extract symptoms and vitals if they exist
                if (recordData.symptoms) {
                    symptoms = { ...symptoms, ...recordData.symptoms };
                }
                if (recordData.vitals) {
                    vitals = { ...vitals, ...recordData.vitals };
                }
            }
        } catch (parseError) {
            console.error("Error parsing patient record:", parseError);
        }

        // Combine patient info with record data
        const patientData = {
            name: patient.name,
            email: patient.email,
            age: patient.age,
            address: patient.account,
            treatments: treatments,
            symptoms: symptoms,
            vitals: vitals
        };

        console.log("Patient record data:", patientData);
        setPatientRecord(patientData);
        setShowRecordModal(true);
    } catch (error) {
        console.error("Error fetching patient record:", error);
        alert("Failed to fetch patient record. Please try again.");
    }
  }
  const submitDiagnosis = async (e) => {
    e.preventDefault()
    const date = new Date();
    const formattedDate = date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });

    try {
        // Get current patient record
        const currentRecord = await mediChain.methods.getPatientRecord(patient.account).call();
        let treatments = [];

        // Parse existing treatments if any
        try {
            if (currentRecord && typeof currentRecord === 'string') {
                const recordData = JSON.parse(currentRecord);
                if (recordData.disease && recordData.treatment) {
                    treatments = [recordData];
                } else if (Array.isArray(recordData)) {
                    treatments = recordData;
                } else if (recordData.treatments && Array.isArray(recordData.treatments)) {
                    treatments = recordData.treatments;
                }
            }
        } catch (error) {
            console.error("Error parsing existing record:", error);
        }

        // Add new treatment
        const newTreatment = {
            disease,
            treatment,
            charges,
            date: formattedDate,
            doctorEmail: doctor.email
        };

        // Add to treatments array
        treatments.push(newTreatment);

        // Save updated record
        await mediChain.methods.insuranceClaimRequest(
            patient.account,
            JSON.stringify(treatments),
            charges
        ).send({from: account}).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        });
    } catch (error) {
        console.error("Error submitting diagnosis:", error);
        alert("Failed to submit diagnosis. Please try again.");
    }
  }

  useEffect(() => {
    if(account === "") return window.location.href = '/login'
    if(!doctor) getDoctorData()
    if(patList.length === 0) getPatientAccessList();
    if(transactionsList.length === 0) getTransactionsList();
  }, [doctor, patList, transactionsList])

  return (
    <div>
      { doctor ?
        <>
          <div className='box'>
            <h2>Doctor's Profile</h2>
            <Form>
              <Form.Group>
                <Form.Label>Name: Dr. {doctor.name}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email: {doctor.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
            </Form>
          </div>
          <div className='box'>
            <h2>List of Patient's Medical Records</h2>
            <Table id='records' striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Patient&nbsp;Name</th>
                  <th>Patient&nbsp;Email</th>
                  <th>Action</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                { patList.length > 0 ?
                  patList.map((pat, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>{pat.name}</td>
                        <td>{pat.email}</td>
                        <td><Button variant='coolColor' onClick={(e) => handleShowModal(pat)} >Diagnose</Button></td>
                        <td><Button variant="coolColor" onClick={(e) => handleShowRecordModal(pat)} >View</Button></td>
                      </tr>
                    )
                  })
                  : <></>
                }
              </tbody>
            </Table>
          </div>
          <div className='box'>
            <h2>List of Transactions</h2>
              <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                      <th>Sr.&nbsp;No.</th>
                      <th>Sender&nbsp;Email</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                  { transactionsList.length > 0 ? 
                    transactionsList.map((transaction, idx) => {
                      return (
                        <tr key={idx}>
                          <td>{idx+1}</td>
                          <td>{transaction.senderEmail}</td>
                          <td>INR {transaction.value}</td>
                          <td>{transaction.settled ? "Settled" : "Pending"}</td>
                        </tr>
                      )
                    })
                    : <></>
                  }
                </tbody>
              </Table>
          </div>
          { patient ? <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Enter diagnosis for: {patient.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                  <Form.Group className='mb-3'>
                    <Form.Label>Disease: </Form.Label>
                    <Form.Control required type="text" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder='Enter disease'></Form.Control>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Treatment: </Form.Label>
                    <Form.Control required as="textarea" value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder='Enter the treatment in details'></Form.Control>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Medical Charges: </Form.Label>
                    <Form.Control required type="number" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder='Enter medical charges incurred'></Form.Control>
                  </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
              <Button type="submit" variant="coolColor" onClick={submitDiagnosis}>
                Submit Diagnosis
              </Button>
            </Modal.Footer>
          </Modal> : <></>
          }
          { patientRecord ? 
            <Modal show={showRecordModal} onHide={handleCloseRecordModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Medical Record</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label><strong>Patient Name:</strong> {patientRecord.name}</Form.Label>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><strong>Patient Email:</strong> {patientRecord.email}</Form.Label>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><strong>Patient Age:</strong> {patientRecord.age}</Form.Label>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label><strong>Address:</strong> {patientRecord.address}</Form.Label>
                        </Form.Group>
                        <h5 className="mt-4">Treatment History</h5>
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Date</th>
                                    <th>Disease</th>
                                    <th>Treatment</th>
                                    <th>Charges</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientRecord.treatments && patientRecord.treatments.length > 0 ? (
                                    patientRecord.treatments.map((treatment, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{treatment.date}</td>
                                            <td>{treatment.disease}</td>
                                            <td>{treatment.treatment}</td>
                                            <td>INR {treatment.charges}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">No treatment records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        <h5 className="mt-4">AI-Assisted Diagnosis</h5>
                        <DoctorML patientData={patientRecord} />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseRecordModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal> 
            : null }
        </>
        : <></>
      }
    </div>
  )
}

export default Doctor


