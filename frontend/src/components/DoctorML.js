import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const DoctorML = ({ patientData }) => {
    const [analysis, setAnalysis] = useState(null);

    const [similarCases] = useState({
        labels: ['Similar Cases', 'Different Presentation', 'Uncertain'],
        datasets: [{
            data: [65, 25, 10],
            backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 99, 132, 0.5)',
                'rgba(255, 206, 86, 0.5)'
            ]
        }]
    });

    const [treatmentEffectiveness] = useState({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Expected Recovery Rate (%)',
                data: [20, 45, 75, 90],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Average Patient Recovery (%)',
                data: [15, 40, 70, 85],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ]
    });

    const analyzeDiagnosis = () => {
        console.log("Analyzing patient data:", patientData);
        
        // Get latest treatment if available
        const latestTreatment = patientData.treatments && patientData.treatments.length > 0 
            ? patientData.treatments[patientData.treatments.length - 1] 
            : null;

        // Initialize analysis object
        let analysisResult = {
            predictedCondition: 'Unknown',
            severity: 'Unknown',
            recommendedTreatment: [],
            confidence: 0
        };

        // Analyze based on latest treatment and current symptoms
        if (latestTreatment) {
            // Use latest treatment for prediction
            if (latestTreatment.disease.toLowerCase().includes('respiratory')) {
                analysisResult = {
                    predictedCondition: 'Respiratory Condition',
                    severity: 'Moderate',
                    recommendedTreatment: [
                        'Continue current medication',
                        'Monitor oxygen levels',
                        'Schedule follow-up in 1 week'
                    ],
                    confidence: 85
                };
            } else if (latestTreatment.disease.toLowerCase().includes('cardiac')) {
                analysisResult = {
                    predictedCondition: 'Cardiac Condition',
                    severity: 'High',
                    recommendedTreatment: [
                        'Immediate cardiology consultation',
                        'ECG monitoring',
                        'Adjust medication as needed'
                    ],
                    confidence: 90
                };
            }
        }

        // Update based on current symptoms if available
        if (patientData.symptoms) {
            const activeSymptoms = Object.entries(patientData.symptoms)
                .filter(([_, value]) => value)
                .map(([key]) => key);

            if (activeSymptoms.length > 0) {
                if (activeSymptoms.includes('breathing') || activeSymptoms.includes('chest')) {
                    analysisResult.severity = 'High';
                    analysisResult.recommendedTreatment.push('Urgent respiratory assessment');
                }
                if (activeSymptoms.includes('fever')) {
                    analysisResult.recommendedTreatment.push('Monitor temperature every 4 hours');
                }
            }
        }

        // Update state with analysis results
        setAnalysis(analysisResult);
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <Button 
                    variant="primary" 
                    onClick={analyzeDiagnosis}
                    className="mb-4"
                >
                    Analyze Patient Data
                </Button>

                {analysis && (
                    <>
                        <Alert variant="info" className="mt-3">
                            <h6>AI Analysis Results:</h6>
                            <p><strong>Predicted Condition:</strong> {analysis.predictedCondition}</p>
                            <p><strong>Severity Level:</strong> {analysis.severity}</p>
                            <p><strong>Confidence:</strong> {analysis.confidence}%</p>
                            <div>
                                <strong>Recommended Actions:</strong>
                                <ul>
                                    {analysis.recommendedTreatment.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </Alert>

                        <div className="row mt-4">
                            <div className="col-md-6 mb-4">
                                <Card>
                                    <Card.Header>Case Similarity Analysis</Card.Header>
                                    <Card.Body>
                                        <Doughnut 
                                            data={similarCases}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { position: 'bottom' },
                                                    title: {
                                                        display: true,
                                                        text: 'Case Pattern Distribution (%)'
                                                    }
                                                }
                                            }}
                                        />
                                    </Card.Body>
                                </Card>
                            </div>
                            <div className="col-md-6 mb-4">
                                <Card>
                                    <Card.Header>Treatment Effectiveness Prediction</Card.Header>
                                    <Card.Body>
                                        <Line 
                                            data={treatmentEffectiveness}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { position: 'bottom' },
                                                    title: {
                                                        display: true,
                                                        text: 'Expected Recovery Timeline'
                                                    }
                                                }
                                            }}
                                        />
                                    </Card.Body>
                                </Card>
                            </div>
                        </div>

                        <Alert variant="warning" className="mt-3">
                            <small>
                                Note: This is an AI-assisted analysis tool. Final diagnosis and treatment decisions 
                                should be based on your professional medical judgment and patient's complete clinical picture.
                            </small>
                        </Alert>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default DoctorML; 