import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Web3 from 'web3';
import {Link} from 'react-router-dom'
import InsurerML from './InsurerML';

const Insurer = ({mediChain, account, ethValue}) => {
    const [insurer, setInsurer] = useState(null);
    const [patList, setPatList] = useState([]);
    const [policyList, setPolicyList] = useState([]);
    const [polName, setPolName] = useState('');
    const [polCoverValue, setPolCoverValue] = useState('');
    const [polDuration, setPolDuration] = useState('');
    const [polPremium, setPolPremium] = useState('');
    const [showRecord, setShowRecord] = useState(false);
    const [claimsIdList, setClaimsIdList] = useState([]);
    const [claimsList, setClaimsList] = useState([]);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [patientRecord, setPatientRecord] = useState(null);
  
    const getInsurerData = async () => {
        var insurer = await mediChain.methods.insurerInfo(account).call();
        setInsurer(insurer);
    }
    const getPolicyList = async () => {
        var pol = await mediChain.methods.getInsurerPolicyList(account).call();
        setPolicyList(pol)
    }
    const createPolicy = (e) => {
        e.preventDefault()
        mediChain.methods.createPolicy(polName, polCoverValue, polDuration, polPremium).send({from: account}).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        })
    }
    const handleCloseRecordModal = () => setShowRecordModal(false);
    const handleShowRecordModal = async (e, patient) => {
        try {
            if (!patient || !patient.account) {
                console.error("Invalid patient data:", patient);
                return;
            }
            console.log("Fetching record for patient:", patient.account);
            var record = await mediChain.methods.getPatientRecord(patient.account).call();
            console.log("Raw record:", record);

            let treatments = [];
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
                treatments: treatments
            };

            console.log("Patient record data:", patientData);
            setPatientRecord(patientData);
            setShowRecordModal(true);
        } catch (error) {
            console.error("Error fetching patient record:", error);
            alert("Failed to fetch patient record. Please try again.");
        }
    }
    const getPatientList = async () => {
        try {
            var pat = await mediChain.methods.getInsurerPatientList(account).call();
            let pt = [];
            for(let i=0; i<pat.length; i++){
                let patient = await mediChain.methods.patientInfo(pat[i]).call();
                patient = { ...patient, account: pat[i] };
                pt = [...pt, patient]
            }
            setPatList(pt)
        } catch (error) {
            console.error("Error fetching patient list:", error);
            alert("Failed to fetch patient list. Please try again.");
        }
    }
    const getClaimsData = async () => {
        var claimsIdList = await mediChain.methods.getInsurerClaims(account).call();
        let cl = [];
        for(let i=claimsIdList.length-1; i>=0; i--){
            let claim = await mediChain.methods.claims(claimsIdList[i]).call();
            let patient = await mediChain.methods.patientInfo(claim.patient).call();
            let doctor = await mediChain.methods.doctorInfo(claim.doctor).call();
            claim = {...claim, id: claimsIdList[i], patientEmail: patient.email, doctorEmail: doctor.email, policyName: claim.policyName}
            cl = [...cl, claim];
        }
        setClaimsList(cl);
    }
    const approveClaim = async (e, claim) => {
        try {
            // Convert claim.valueClaimed and ethValue to numbers
            const claimValue = Number(claim.valueClaimed);
            const ethValueNum = Number(ethValue);
            
            if (isNaN(claimValue) || isNaN(ethValueNum) || ethValueNum === 0) {
                console.error("Invalid values for claim calculation");
                alert("Invalid values for claim calculation");
                return;
            }

            // Calculate the value in ETH
            const valueInEth = claimValue / ethValueNum;
            
            // Convert to Wei using Web3.utils
            const valueInWei = Web3.utils.toWei(valueInEth.toString(), 'ether');

            // Send the transaction
            await mediChain.methods.approveClaimsByInsurer(claim.id).send({
                from: account,
                value: valueInWei
            }).on('transactionHash', (hash) => {
                return window.location.href = '/login';
            });
        } catch (error) {
            console.error("Error in approving claim:", error);
            alert("Failed to approve claim. Please try again.");
        }
    }
    const rejectClaim = async (e, claim) => {
        mediChain.methods.rejectClaimsByInsurer(claim.id).send({from: account}).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        })
    }

    const handleShowRecord = (e, pat) => {
        var table = document.getElementById('records');
        var idx = e.target.parentNode.parentNode.rowIndex;
        if(!showRecord){
            var row = table.insertRow(idx+1);
            row.innerHTML = "Yo"
            setShowRecord(true);
        }else{
            table.deleteRow(idx + 1);
            setShowRecord(false);
        }
    }

    useEffect(() => {
        if(account === "") return window.location.href = '/login'
        if(!insurer) getInsurerData()
        if(policyList.length === 0) getPolicyList();
        if(patList.length === 0) getPatientList();
        if(claimsIdList.length === 0) getClaimsData();
    }, [insurer, patList, policyList, claimsIdList])


    return (
        <div>
        { insurer ?
            <>
                <div className='box'>
                    <h2>Insurer's Profile</h2>
                    <Form>
                        <Form.Group>
                            <Form.Label>Name: {insurer.name}</Form.Label>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Email: {insurer.email}</Form.Label>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Address: {account}</Form.Label>
                        </Form.Group>
                    </Form>
                </div>
                <div className='box'>
                    <h2>Create New Insurance Policy</h2>
                    <Form>
                        <Form.Group className='mb-3'>
                            <Form.Label>Policy Name: </Form.Label>
                            <Form.Control required type="text" value={polName} onChange={(e) => setPolName(e.target.value)} placeholder='Enter policy name'></Form.Control>
                        </Form.Group>
                        <Form.Group className='mb-3'>
                            <Form.Label>Cover Value: </Form.Label>
                            <Form.Control required type="number" value={polCoverValue} onChange={(e) => setPolCoverValue(e.target.value)} placeholder='Enter the cover value in INR'></Form.Control>
                        </Form.Group>
                        <Form.Group className='mb-3'>
                            <Form.Label>Yearly Premium: </Form.Label>
                            <Form.Control required type="number" value={polPremium} onChange={(e) => setPolPremium(e.target.value)} placeholder='Enter the annual premium in INR'></Form.Control>
                        </Form.Group>
                        <Form.Group className='mb-3'>
                            <Form.Label>Policy Period (in years): </Form.Label>
                            <Form.Control required type="number" max={3} min={1} value={polDuration} onChange={(e) => setPolDuration(e.target.value)} placeholder='Enter policy duration'></Form.Control>
                        </Form.Group>
                        <Button type="submit" variant="coolColor" onClick={createPolicy}>
                            Create Policy
                        </Button>
                    </Form>
                </div>
                <div className='box'>
                    <h2>List of Policies</h2>
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>Sr.&nbsp;No.</th>
                                <th>Policy&nbsp;Name</th>
                                <th>Policy&nbsp;Cover</th>
                                <th>Policy&nbsp;Premium</th>
                                <th>Policy&nbsp;Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            { policyList.length > 0 ?
                                policyList.map((pol, idx) => {
                                    return (
                                    <tr key={idx}>
                                        <td>{idx+1}</td>
                                        <td>{pol.name}</td>
                                        <td>INR {pol.coverValue}</td>
                                        <td>INR {pol.premium}/year</td>
                                        <td>{pol.timePeriod} Year{pol.timePeriod >1 ? 's': ''}</td>
                                    </tr>
                                    )
                                })
                                : <></>
                            }
                        </tbody>
                    </Table>
                </div>
                <div className='box'>
                    <h2>List of Customers</h2>
                    <Table id='records' striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>Sr.&nbsp;No.</th>
                                <th>Customer&nbsp;Name</th>
                                <th>Customer&nbsp;Email</th>
                                <th>Policy&nbsp;Name</th>
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
                                            <td>{pat.policyActive ? pat.policy.name : "-"}</td>
                                            <td><Button variant="coolColor" onClick={(e) => handleShowRecordModal(e, pat)} >View</Button></td>
                                        </tr>
                                    )
                                })
                                : <></>
                            }
                        </tbody>
                    </Table>
                </div>
                <div className='box'>
                    <h2>List of Claims</h2>
                    <Table striped bordered hover size="sm">
                        <thead>
                            <tr>
                                <th>Sr.&nbsp;No.</th>
                                <th>Patient&nbsp;Email</th>
                                <th>Doctor&nbsp;Email</th>
                                <th>Policy&nbsp;Name</th>
                                <th>Claim&nbsp;Value</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            { claimsList.length > 0 ?
                                claimsList.map((claim, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td>{idx+1}</td>
                                            <td>{claim.patientEmail}</td>
                                            <td>{claim.doctorEmail}</td>
                                            <td>{claim.policyName}</td>
                                            <td>INR {claim.valueClaimed}</td>
                                            <td>{!claim.approved && !claim.rejected ? "Pending" : !claim.approved ? "Rejected" : "Accepted"}</td>
                                            <td>
                                                { !claim.approved && !claim.rejected ?
                                                    <DropdownButton title="Action" variant='coolColor'>
                                                        <Dropdown.Item onClick={(e) => approveClaim(e, claim)} >Approve</Dropdown.Item>
                                                        <Dropdown.Item onClick={(e) => rejectClaim(e, claim)} >Reject</Dropdown.Item>
                                                    </DropdownButton>
                                                : <DropdownButton title="Action" disabled variant='coolColor'>
                                                    <Dropdown.Item onClick={(e) => approveClaim(e, claim)} >Approve</Dropdown.Item>
                                                    <Dropdown.Item onClick={(e) => rejectClaim(e, claim)} >Reject</Dropdown.Item>
                                                  </DropdownButton>
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
                    { patientRecord ? 
                        <Modal show={showRecordModal} onHide={handleCloseRecordModal}>
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
                                </Form>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseRecordModal}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </Modal> 
                    : null }
                <div className='box'>
                    <h2>AI-Assisted Claim Analysis</h2>
                    <InsurerML claimData={patientRecord} />
                </div>
                </>
                : <div>Loading...</div>
            }
        </div>
    )
}


export default Insurer


