import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const InsurerML = ({ claimData }) => {
    const [analysis, setAnalysis] = useState(null);

    const [claimHistory] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Claim Amount (INR)',
                data: [12000, 15000, 8000, 20000, 16000, 25000],
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
        ]
    });

    const [riskDistribution] = useState({
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
            data: [45, 35, 20],
            backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(255, 99, 132, 0.5)'
            ]
        }]
    });

    const analyzeRisk = () => {
        // Simulated risk analysis based on claim data
        const claimAmount = parseFloat(claimData.amount);
        const claimFrequency = parseInt(claimData.frequency);
        const preExistingConditions = claimData.conditions || [];

        let riskLevel = '';
        let fraudProbability = 0;
        let recommendations = [];

        // Simple rule-based risk assessment
        if (claimAmount > 20000) {
            if (claimFrequency > 3) {
                riskLevel = 'High';
                fraudProbability = 75;
                recommendations.push('Detailed investigation required');
                recommendations.push('Review previous claims history');
            } else {
                riskLevel = 'Medium';
                fraudProbability = 25;
                recommendations.push('Standard verification process');
            }
        } else {
            riskLevel = 'Low';
            fraudProbability = 5;
            recommendations.push('Fast-track approval recommended');
        }

        // Additional checks for pre-existing conditions
        if (preExistingConditions.length > 0) {
            recommendations.push('Verify coverage for pre-existing conditions');
        }

        setAnalysis({
            riskLevel,
            fraudProbability,
            recommendations,
            expectedSettlement: claimAmount * 0.8 // Example: 80% of claim amount
        });
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <h5 className="mb-3">AI-Assisted Claim Analysis</h5>
                <Button 
                    variant="primary" 
                    onClick={analyzeRisk}
                    className="mb-4"
                >
                    Analyze Claim Risk
                </Button>

                {analysis && (
                    <>
                        <Alert variant="info">
                            <h6>Risk Analysis Results:</h6>
                            <p><strong>Risk Level:</strong> {analysis.riskLevel}</p>
                            <p><strong>Fraud Probability:</strong> {analysis.fraudProbability}%</p>
                            <p><strong>Expected Settlement:</strong> INR {analysis.expectedSettlement}</p>
                            <div>
                                <strong>Recommendations:</strong>
                                <ul>
                                    {analysis.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </Alert>

                        <div className="row mt-4">
                            <div className="col-md-6 mb-4">
                                <Card>
                                    <Card.Header>Claim History Analysis</Card.Header>
                                    <Card.Body>
                                        <Bar 
                                            data={claimHistory}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { position: 'top' },
                                                    title: {
                                                        display: true,
                                                        text: '6-Month Claim History'
                                                    }
                                                }
                                            }}
                                        />
                                    </Card.Body>
                                </Card>
                            </div>
                            <div className="col-md-6 mb-4">
                                <Card>
                                    <Card.Header>Risk Distribution</Card.Header>
                                    <Card.Body>
                                        <Pie 
                                            data={riskDistribution}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { position: 'bottom' },
                                                    title: {
                                                        display: true,
                                                        text: 'Overall Risk Distribution (%)'
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
                                Note: This is an AI-assisted analysis tool. Final claim decisions 
                                should be based on company policies and thorough verification.
                            </small>
                        </Alert>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default InsurerML; 