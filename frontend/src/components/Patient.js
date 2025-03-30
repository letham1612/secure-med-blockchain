import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal'
import { Link } from 'react-router-dom'
import Web3 from 'web3';
import BN from 'bn.js';
import MLPrediction from './MLPrediction';

const Patient = ({mediChain, account, ethValue}) => {
  const [patient, setPatient] = useState(null);
  const [docEmail, setDocEmail] = useState("");
  const [docList, setDocList] = useState([]);
  const [insurer, setInsurer] = useState(null);
  const [insurerList, setInsurerList] = useState([]);
  const [buyFromInsurer, setBuyFromInsurer] = useState(null);
  const [policyList, setPolicyList] = useState([]);
  const [buyPolicyIndex, setBuyPolicyIndex] = useState(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);

  const getPatientData = async () => {
      var patient = await mediChain.methods.patientInfo(account).call();
      setPatient(patient);
  }
  const giveAccess = (e) => {
    e.preventDefault();
    mediChain.methods.permitAccess(docEmail).send({from: account}).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }
  const revokeAccess = async (email) => {
    var addr = await mediChain.methods.emailToAddress(email).call();
    mediChain.methods.revokeAccess(addr).send({from: account}).on('transactionHash', (hash) => {
      return window.location.href = '/login';
    });
  }
  const getDoctorAccessList = async () => {
    var doc = await mediChain.methods.getPatientDoctorList(account).call();
    let dt = [];
    for(let i=0; i<doc.length; i++){
      let doctor = await mediChain.methods.doctorInfo(doc[i]).call();
      dt = [...dt, doctor]
    }
    setDocList(dt)
  }
  const getInsurer = async () => {
    var insurer = await mediChain.methods.insurerInfo(patient.policy.insurer).call();
    setInsurer(insurer)
  }
  const getInsurerList = async () => {
    var ins = await mediChain.methods.getAllInsurersAddress().call();
    let it = [];
    for(let i=0; i<ins.length; i++){
      let insurer = await mediChain.methods.insurerInfo(ins[i]).call();
      insurer = {...insurer, account: ins[i]};
      it = [...it, insurer]
    }
    setInsurerList(it)
  }
  const getPolicyList = async () => {
    if (!buyFromInsurer) return;
    var policyList = await mediChain.methods.getInsurerPolicyList(buyFromInsurer).call()
    setPolicyList(policyList);
  }
  const purchasePolicy = async (e) => {
    e.preventDefault();
    if (!buyFromInsurer || buyPolicyIndex === null) {
      alert("Please select an insurer and policy");
      return;
    }
    const premium = policyList[buyPolicyIndex].premium;
    const value = Web3.utils.toWei(premium.toString(), 'ether');
    mediChain.methods.buyPolicy(parseInt(policyList[buyPolicyIndex].id))
      .send({
        from: account, 
        value: value
      })
      .on('transactionHash', (hash) => {
        return window.location.href = '/login'
      })
  }
  const getTransactionsList = async () => {
    var transactionsIdList = await mediChain.methods.getPatientTransactions(account).call();
    let tr = [];
    for(let i=transactionsIdList.length-1; i>=0; i--){
        let transaction = await mediChain.methods.transactions(transactionsIdList[i]).call();
        let doctor = await mediChain.methods.doctorInfo(transaction.receiver).call();
        transaction = {...transaction, id: transactionsIdList[i], doctorEmail: doctor.email}
        tr = [...tr, transaction];
    }
    setTransactionsList(tr);
  }
  const settlePayment = async (e, transaction) => {
    try {
        let transactionValue = Number(transaction.value);
        let ethValueNumber = Number(ethValue);
        let value = transactionValue / ethValueNumber;
        mediChain.methods.settleTransactionsByPatient(transaction.id).send({
            from: account,
            value: Web3.utils.toWei(value.toString(), 'ether')
        }).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        });
    } catch (error) {
        console.error('Error settling payment:', error);
    }
}

  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowRecordModal = async () => {
    const patientDataWithAddress = {
        ...patient,
        address: account
    };
    setPatientRecord(patientDataWithAddress);
    setShowRecordModal(true);
  }

  useEffect(() => {
    if(account === "") return window.location.href = '/login'
    if(!patient) getPatientData()
    if(docList.length === 0) getDoctorAccessList();
    if(patient?.policyActive) getInsurer();
    if(insurerList.length === 0) getInsurerList();
    if(buyFromInsurer) getPolicyList();
    if(transactionsList.length === 0) getTransactionsList();
  }, [patient, docList, insurerList, buyFromInsurer, transactionsList])

  return (
    <div>
      { patient ?
        <>
          <div className='box'>
            <h2>Patient's Profile</h2>
            <Form>
              <Form.Group>
                <Form.Label>Name: {patient.name}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Email address: {patient.email}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Age: {patient.age}</Form.Label>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address: {account}</Form.Label>
              </Form.Group>
            </Form>
            <div>
              <span>Your records are stored here: &nbsp; &nbsp;</span>
              <Button variant="coolColor" style={{width: "20%", height: "4vh"}} onClick={handleShowRecordModal}>View Records</Button>
            </div>
          </div>
          <div className='box'>
            <h2>Symptom Analysis & Health Assessment</h2>
            <MLPrediction />
          </div>
          <div className='box'>
            <h2>Share Your Medical Record with Doctor</h2>
            <Form onSubmit={giveAccess}>
              <Form.Group className="mb-3">
                <Form.Label>Email:</Form.Label>
                <Form.Control required type="email" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} placeholder="Enter doctor's email"></Form.Control>
              </Form.Group>
              <Button variant="coolColor" type="submit">
                  Submit
              </Button>
            </Form>
            <br />
            <h4>List of Doctor's you have given access to your medical records</h4>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Doctor&nbsp;Name</th>
                  <th>Doctor&nbsp;Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { docList.length > 0 ? 
                  docList.map((doc, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>Dr. {doc.name}</td>
                        <td>{doc.email}</td>
                        <td><Button className='btn-danger' onClick={() => revokeAccess(doc.email)}>Revoke</Button></td>
                      </tr>
                    )
                  })
                  : <></>
                }
              </tbody>
            </Table>
          </div>
          <div className='box'>
            { patient.policyActive && insurer
              ?
              <>
                <h2>Insurance Policy Details</h2>
                <Form>
                  <Form.Group>
                    <Form.Label>Insurance Provider Name: {insurer.name}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email address: {insurer.email}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Insurance Policy Name: {patient.policy.name}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Insurance Duration: {patient.policy.timePeriod} Year{patient.policy.timePeriod >1 ? 's': ''}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Remaining Cover Value: INR {patient.policy.coverValue}</Form.Label>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Premium: INR {patient.policy.premium}/year</Form.Label>
                  </Form.Group>
                </Form>
              </>
              :
              <>
                <h2>Buy Insurance Policy</h2>
                <Form onSubmit={purchasePolicy}>
                  <Form.Group className='mb-3'>
                    <Form.Label>Select Insurance Provider:</Form.Label>
                    <Form.Select 
                      required
                      onChange={(e) => {
                        if (e.target.value !== "Choose") {
                          setBuyFromInsurer(e.target.value);
                          getPolicyList();
                        }
                      }}>
                      <option value="Choose">Choose</option>
                      {
                        insurerList.length > 0
                        ? insurerList.map((ins, idx) => {
                          return <option key={idx} value={ins.account}>{ins.name}</option>
                        })
                        : <></>
                      }
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className='mb-3'>
                    <Form.Label>Select Insurance Policy:</Form.Label>
                    <Form.Select 
                      required
                      onChange={(e) => {
                        if (e.target.value !== "Choose") {
                          setBuyPolicyIndex(parseInt(e.target.value));
                        }
                      }}>
                      <option value="Choose">Choose</option>
                      {
                        policyList.length > 0
                        ? policyList.map((pol, idx) => {
                          return <option key={idx} value={idx}>{pol.name}</option>
                        })
                        : <></>
                      }
                    </Form.Select>
                  </Form.Group>
                  { policyList[buyPolicyIndex]
                    ? <div>
                        <p>Policy Name: {policyList[buyPolicyIndex].name}</p>
                        <p>Duration: {policyList[buyPolicyIndex].timePeriod} Year{policyList[buyPolicyIndex].timePeriod >1 ? 's': ''}</p>
                        <p>Cover Value: INR {policyList[buyPolicyIndex].coverValue}</p>
                        <p>Premium: INR {policyList[buyPolicyIndex].premium}/year</p>
                    </div>
                    : <></>
                  }
                  <Button variant="coolColor" type="submit">Buy Policy</Button>
                </Form>
              </>
            }
          </div>
          <div className='box'>
            <h2>List of Transactions</h2>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sr.&nbsp;No.</th>
                  <th>Doctor&nbsp;Name</th>
                  <th>Doctor&nbsp;Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                { transactionsList.length > 0 ? 
                  transactionsList.map((transaction, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>Dr. {transaction.doctorName}</td>
                        <td>{transaction.doctorEmail}</td>
                        <td>INR {transaction.value}</td>
                        <td>{transaction.settled ? "Settled" : "Pending"}</td>
                        <td>
                          { !transaction.settled ? 
                            <Button variant="coolColor" onClick={(e) => settlePayment(e, transaction)}>Settle</Button>
                            : <></>
                          }
                        </td>
                      </tr>
                    )
                  })
                  : <></>
                }
              </tbody>
            </Table>
          </div>
        </>
        : <></>
      }
      <Modal show={showRecordModal} onHide={handleCloseRecordModal}>
        <Modal.Header closeButton>
          <Modal.Title>Medical Records</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { patientRecord ? 
            <Form>
              <Form.Group className="mb-3">
                <Form.Label><strong>Name:</strong> {patientRecord.name}</Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Age:</strong> {patientRecord.age}</Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Email:</strong> {patientRecord.email}</Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Address:</strong> {patientRecord.address}</Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Policy Status:</strong> {patientRecord.policyActive ? "Active" : "Inactive"}</Form.Label>
              </Form.Group>
              {patientRecord.policyActive && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Policy Name:</strong> {patientRecord.policy.name}</Form.Label>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Policy Duration:</strong> {patientRecord.policy.timePeriod} Year{patientRecord.policy.timePeriod > 1 ? 's' : ''}</Form.Label>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Cover Value:</strong> INR {patientRecord.policy.coverValue}</Form.Label>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Premium:</strong> INR {patientRecord.policy.premium}/year</Form.Label>
                  </Form.Group>
                </>
              )}
            </Form>
            : <></>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRecordModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Patient


