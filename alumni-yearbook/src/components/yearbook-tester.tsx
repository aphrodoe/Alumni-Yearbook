import { useState } from 'react';

export default function YearbookTester() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchResult, setBatchResult] = useState<any>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusResult, setStatusResult] = useState<any>(null);

    const generateSingleYearbook = async () => {
        if (!email) {
            alert('Please enter an email');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/generate-yearbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: 'Failed to generate yearbook' });
        } finally {
            setLoading(false);
        }
    };

    const generateAllYearbooks = async () => {
        setBatchLoading(true);
        setBatchResult(null);

        try {
            const response = await fetch('/api/generate-all-yearbooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            setBatchResult(data);
        } catch (error) {
            setBatchResult({ error: 'Failed to generate yearbooks' });
        } finally {
            setBatchLoading(false);
        }
    };

    const checkYearbookStatus = async () => {
        if (!email) {
            alert('Please enter an email');
            return;
        }

        setStatusLoading(true);
        setStatusResult(null);

        try {
            const response = await fetch(`/api/yearbook-status?email=${encodeURIComponent(email)}`);
            const data = await response.json();
            setStatusResult(data);
        } catch (error) {
            setStatusResult({ error: 'Failed to check status' });
        } finally {
            setStatusLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-center">Yearbook Generator Tester</h1>
            
            {/* Single Yearbook Generation */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Generate Single Yearbook</h2>
                <div className="flex gap-4 mb-4">
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={generateSingleYearbook}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating...' : 'Generate Yearbook'}
                    </button>
                    <button
                        onClick={checkYearbookStatus}
                        disabled={statusLoading}
                        className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {statusLoading ? 'Checking...' : 'Check Status'}
                    </button>
                </div>
                
                {result && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="font-semibold mb-2">Generation Result:</h3>
                        <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                        {result.s3Url && (
                            <a
                                href={result.s3Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                View Generated Yearbook
                            </a>
                        )}
                    </div>
                )}

                {statusResult && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                        <h3 className="font-semibold mb-2">Status Result:</h3>
                        <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(statusResult, null, 2)}
                        </pre>
                        {statusResult.s3Url && (
                            <a
                                href={statusResult.s3Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                View Existing Yearbook
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Batch Generation */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Generate All Yearbooks</h2>
                <button
                    onClick={generateAllYearbooks}
                    disabled={batchLoading}
                    className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {batchLoading ? 'Generating All...' : 'Generate All Yearbooks'}
                </button>
                
                {batchResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="font-semibold mb-2">Batch Result:</h3>
                        <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(batchResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Make sure you have the manual yearbook at <code>public/manual-yearbook.pdf</code></li>
                    <li>Ensure AWS S3 credentials are configured in your environment variables</li>
                    <li>The temp directory should exist for intermediate file storage</li>
                    <li>Only users with <code>hasCompletedPreferences: true</code> will have yearbooks generated</li>
                </ul>
            </div>
        </div>
    );
}
