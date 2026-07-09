import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, MapPin, Phone, Sparkles } from 'lucide-react';

export default function DonorsPage() {
  const [donors, setDonors] = useState([]);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    location: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDonors = async (newPage = 1) => {
    try {
      const res = await api.get('/api/donors', {
        params: {
          bloodGroup: filters.bloodGroup,
          location: filters.location,
          page: newPage,
          limit: 6,
        },
      });

      setDonors(res.data.data.donors || []);
      setTotalPages(res.data.data.pages || 1);
      setPage(newPage);
    } catch (err) {
      console.error(err);
      setDonors([]);
    }
  };

  useEffect(() => {
    fetchDonors(1);
  }, []);

  return (
    <div className="space-y-6">

      {/* Search Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">

        <div className="mb-5 flex items-center gap-2 text-red-300 text-lg font-semibold">
          <Sparkles size={18} />
          Search Donors
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          {/* Blood Group */}

          <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
            <label className="mb-2 block text-sm text-slate-400">
              Blood Group
            </label>

            <select
              value={filters.bloodGroup}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  bloodGroup: e.target.value,
                })
              }
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-slate-300 outline-none"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          {/* Location */}

          <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
            <label className="mb-2 block text-sm text-slate-400">
              Location
            </label>

            <input
           
              type="text"
              placeholder="Enter city or location"
              value={filters.location}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  location: e.target.value,
                })
              }
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-slate-300 placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Search Button */}

          <div className="flex items-end">
            <button
              onClick={() => fetchDonors(1)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold transition hover:scale-[1.02]"
            >
              <Search size={18} />
              Search
            </button>
          </div>

        </div>
      </div>

      {/* Donor Cards */}

      {donors.length === 0 ? (

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-16 text-center">

          <h2 className="text-xl font-semibold text-white">
            No Donors Found
          </h2>

          <p className="mt-2 text-slate-400">
            Try changing the blood group or location.
          </p>

        </div>

      ) : (

        <div className="grid gap-4 lg:grid-cols-2">

          {donors.map((donor) => (

            <div
              key={donor._id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-red-500/30"
            >
              <div className="flex items-start justify-between">

                <div>

                  <h3 className="text-lg font-semibold">
                    {donor.name || 'Unknown'}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {donor.department || 'Department'} •{' '}
                    {donor.year || 'Year'}
                  </p>

                </div>

                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300">
                  {donor.bloodGroup}
                </span>

              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-400">

                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  {donor.city || 'Location not available'}
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  {donor.phone || 'Phone not available'}
                </div>

              </div>

              <div className="mt-5 flex items-center justify-start">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    donor.availability
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {donor.availability
                    ? 'Available'
                    : 'Unavailable'}
                </span>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* Pagination */}

      {totalPages > 1 && (

        <div className="flex justify-center gap-2">

          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((num) => (

            <button
              key={num}
              onClick={() => fetchDonors(num)}
              className={`rounded-lg px-4 py-2 transition ${
                page === num
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {num}
            </button>

          ))}

        </div>

      )}

    </div>
  );
}