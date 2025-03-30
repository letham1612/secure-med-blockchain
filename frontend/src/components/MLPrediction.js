import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const MLPrediction = () => {
    const [symptoms, setSymptoms] = useState({
        fever: false,
        cough: false,
        fatigue: false,
        breathing: false,
        headache: false,
        throat: false,
        chest: false,
        bodyPain: false
    });

    const [vitals, setVitals] = useState({
        temperature: '',
        heartRate: '',
        oxygenLevel: '',
        bloodPressure: ''
    });

    const [prediction, setPrediction] = useState(null);

    const [vitalHistory] = useState({
        labels: ['Previous', '2 Days Ago', 'Yesterday', 'Today'],
        datasets: [
            {
                label: 'Temperature (°C)',
                data: [37.2, 37.5, 38.0, 38.3],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Heart Rate (bpm)',
                data: [75, 85, 95, 113],
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Oxygen Level (%)',
                data: [98, 96, 94, 55],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
        ]
    });

    const [symptomStats] = useState({
        labels: ['Fever', 'Cough', 'Fatigue', 'Breathing', 'Headache', 'Throat', 'Chest', 'BodyPain'],
        datasets: [{
            label: 'Symptom Frequency in Similar Cases',
            data: [65, 80, 45, 55, 40, 60, 30, 35],
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }]
    });

    const handleSymptomChange = (symptom) => {
        setSymptoms(prev => ({
            ...prev,
            [symptom]: !prev[symptom]
        }));
    };

    const handleVitalChange = (vital, value) => {
        setVitals(prev => ({
            ...prev,
            [vital]: value
        }));
    };

    const analyzePrediction = () => {
        // Đếm số triệu chứng
        const symptomCount = Object.values(symptoms).filter(Boolean).length;
        
        // Kiểm tra các chỉ số sinh tồn
        const temp = parseFloat(vitals.temperature);
        const heartRate = parseInt(vitals.heartRate);
        const oxygenLevel = parseInt(vitals.oxygenLevel);
        const bloodPressure = parseInt(vitals.bloodPressure);

        let condition = '';
        let severity = '';
        let recommendations = [];

        // Logic dự đoán đơn giản
        if (temp >= 38.5 && symptoms.cough && symptoms.breathing) {
            condition = 'Respiratory Infection';
            if (oxygenLevel < 95) {
                severity = 'High';
                recommendations.push('Seek immediate medical attention');
            } else {
                severity = 'Moderate';
                recommendations.push('Schedule doctor consultation');
            }
        } else if (temp >= 37.5 && symptoms.throat && symptoms.cough) {
            condition = 'Upper Respiratory Tract Infection';
            severity = 'Mild';
            recommendations.push('Rest and monitor symptoms');
            recommendations.push('Stay hydrated');
        } else if (symptoms.headache && symptoms.fatigue && !symptoms.fever) {
            condition = 'Stress or Fatigue';
            severity = 'Low';
            recommendations.push('Get adequate rest');
            recommendations.push('Practice stress management');
        }

        // Kiểm tra huyết áp và nhịp tim
        if (bloodPressure > 140 || heartRate > 100) {
            recommendations.push('Monitor blood pressure and heart rate');
        }

        // Nếu có nhiều triệu chứng nhưng không khớp với các pattern trên
        if (symptomCount >= 4 && !condition) {
            condition = 'Complex Symptoms';
            severity = 'Moderate';
            recommendations.push('Consult healthcare provider for detailed evaluation');
        }

        // Nếu không có đủ thông tin
        if (!condition) {
            condition = 'Insufficient Data';
            severity = 'Unknown';
            recommendations.push('Provide more symptom information');
        }

        return {
            condition,
            severity,
            recommendations
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = analyzePrediction();
        setPrediction(result);
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <h5 className="mb-3">Symptoms</h5>
                    <div className="row mb-4">
                        {Object.keys(symptoms).map((symptom) => (
                            <div className="col-md-3 mb-2" key={symptom}>
                                <Form.Check
                                    type="checkbox"
                                    id={symptom}
                                    label={symptom.charAt(0).toUpperCase() + symptom.slice(1)}
                                    checked={symptoms[symptom]}
                                    onChange={() => handleSymptomChange(symptom)}
                                />
                            </div>
                        ))}
                    </div>

                    <h5 className="mb-3">Vital Signs</h5>
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Temperature (°C)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.1"
                                    value={vitals.temperature}
                                    onChange={(e) => handleVitalChange('temperature', e.target.value)}
                                    placeholder="36.5-37.5"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Heart Rate (bpm)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={vitals.heartRate}
                                    onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                                    placeholder="60-100"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Oxygen Level (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={vitals.oxygenLevel}
                                    onChange={(e) => handleVitalChange('oxygenLevel', e.target.value)}
                                    placeholder="95-100"
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-3">
                            <Form.Group>
                                <Form.Label>Blood Pressure (mmHg)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={vitals.bloodPressure}
                                    onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                                    placeholder="120"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <Button variant="primary" type="submit">
                        Analyze Symptoms
                    </Button>

                    {prediction && (
                        <>
                            <Alert variant="info" className="mt-4">
                                <h6>Analysis Results:</h6>
                                <p><strong>Potential Condition:</strong> {prediction.condition}</p>
                                <p><strong>Severity Level:</strong> {prediction.severity}</p>
                                <div>
                                    <strong>Recommendations:</strong>
                                    <ul>
                                        {prediction.recommendations.map((rec, index) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                                <small className="text-muted">
                                    Note: This is an AI-assisted preliminary assessment. 
                                    Please consult with a healthcare professional for accurate diagnosis and treatment.
                                </small>
                            </Alert>

                            <div className="row mt-4">
                                <div className="col-md-6 mb-4">
                                    <Card>
                                        <Card.Header>Vital Signs Trend</Card.Header>
                                        <Card.Body>
                                            <Line 
                                                data={vitalHistory}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: { position: 'top' },
                                                        title: {
                                                            display: true,
                                                            text: '4-Day Vital Signs Trend'
                                                        }
                                                    }
                                                }}
                                            />
                                        </Card.Body>
                                    </Card>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <Card>
                                        <Card.Header>Symptom Analysis</Card.Header>
                                        <Card.Body>
                                            <Bar 
                                                data={symptomStats}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: { position: 'top' },
                                                        title: {
                                                            display: true,
                                                            text: 'Common Symptoms Distribution (%)'
                                                        }
                                                    }
                                                }}
                                            />
                                        </Card.Body>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </Card.Body>
        </Card>
    );
};

export default MLPrediction; 