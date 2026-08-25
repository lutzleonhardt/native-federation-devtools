// Verbatim SnapshotV1 panel export — captured live from the official
// Native Federation playground (https://native-federation.github.io/playground/,
// page /playground/checkout/cart) on 2026-08-25 via the extension's Export
// button, collector nf-devtools-collector/3.
// Source file: nf-snapshot-native-federation.github.io-20260825T102045Z.json
// (sha256 6ce62f4ed2727ac7611d17d1d14e5bc7e9de32c62a6b4bd93876485ab6c7a37a).
//
// Witness of SPA-navigation resolution-base recovery: relative import-map
// targets and the host's `./` scope were parsed at the load base
// `/playground/`, while history.pushState moved `capture.pageUrl` into
// `@tractor-store/checkout`'s scope directory. Resolving against `pageUrl`
// collapses every share into ambiguous target-URL copies; the recovered
// base (importMaps.effective oracle) keeps all sources unique.
//
// `exported-` class: no lab-lossless envelope exists for this capture, so
// the fixture-drift guard cannot re-derive it — the module is the frozen
// evidence itself and must never be edited by hand.

import { SnapshotV1 } from '../snapshot-v1';

export const exportedPlaygroundCheckoutFixture: SnapshotV1 = {
  "schemaVersion": 1,
  "capture": {
    "pageUrl": "https://native-federation.github.io/playground/checkout/cart",
    "capturedAt": "2026-08-25T10:20:45.386Z",
    "mode": "passive",
    "collectorVersion": "nf-devtools-collector/3"
  },
  "channels": {
    "nativeFederationGlobals": {
      "state": "available"
    },
    "domImportMaps": {
      "state": "available"
    },
    "importShim": {
      "state": "available"
    }
  },
  "runtime": {
    "remotes": {
      "@tractor-store/explore": {
        "scopeUrl": "/playground/explore/",
        "exposes": [
          {
            "moduleName": "mfe-home",
            "file": "mfe-home-QJGJZXVQ.js"
          },
          {
            "moduleName": "mfe-category",
            "file": "mfe-category-3SNGYRGZ.js"
          },
          {
            "moduleName": "mfe-stores",
            "file": "mfe-stores-SY4FLME3.js"
          },
          {
            "moduleName": "mfe-header",
            "file": "mfe-header-W2OE6E3A.js"
          },
          {
            "moduleName": "mfe-footer",
            "file": "mfe-footer-7QGH7EAH.js"
          },
          {
            "moduleName": "mfe-recommendations",
            "file": "mfe-recommendations-KZYO4SSQ.js"
          },
          {
            "moduleName": "mfe-store-picker",
            "file": "mfe-store-picker-PCDPARLG.js"
          },
          {
            "moduleName": "nav-contribution",
            "file": "nav-contribution-R3ZWNATU.js"
          }
        ],
        "integrity": {
          "_angular_common.G-CZnQLQoU.js": "sha384-YX2ZphvPB4ng+hlNirpK95UfvGpQow9JU0TyfSTTGZy82O4GxlbbYN+rYWwK9mHW",
          "_angular_common_http.rvzjQNS0mn.js": "sha384-o0Fnr++qML3pVU39/XDRf6DlF3BWq66xQ7tVOLwsGMzjrGPvMJdWtihsCSktEx1c",
          "chunk-MO7I3UEP.js": "sha384-ujSjhWs5fOkg33UJvC512MsRIUqQUYHZKuTDm7SHJl9qzXgRviKdIEXImm7uU9AG",
          "_angular_core.EWio10v_5e.js": "sha384-YsBiGZpPdvFiS6DVTBsh+GQaHFpzOuxK+I35TisMRO4R3QtNFQANk2RoPgpIpbG8",
          "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js": "sha384-5wVWeVYtx1cBT1jKmN8rQ7UM9OvfVXX8EiLwaa0Ske0MZEGspZWPPZzpPCmI7TvV",
          "_angular_core_primitives_di.HXp0bO89XM.js": "sha384-TjHSEGrEKJeSPDKQsgl6zRacbgz6jim9ccXHSpEMRsjHly2NLb+7gMPv7RVC93Yl",
          "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js": "sha384-37HVT8hkl0o/okswOrTWfkY0fqJJ++s3lwAoeJGPiYdE4ssP/c6e5PJdypaQ4kET",
          "chunk-6BOBWJD7.js": "sha384-TLRDiXCxEf2r27e9uCz825NMBKADrieMuQEIn+JVyD0mXZE/z2Pd299eq84Ms0dl",
          "_angular_core_primitives_signals.oN7Cdd5oIf.js": "sha384-7GrDDA4gZNuEkF1rR+65yxoNsOpJmdHpbkrmbo72XZEhX7BIK0TM/54kPthuaXmU",
          "_angular_core_rxjs_interop.Sn3puXfArQ.js": "sha384-Nbt6nd6pLUvIQKtCdUk1VZN5cBSoT5x5i0HMkS9b6/aNoU1mAdY9lQoCUHYJdHfy",
          "chunk-ZR2C3J5K.js": "sha384-FCW/XBFRyqVu+L7UP1kQ7QEQo3WW6K6hcahb2+qVhrxqS2n3ADadbK08fT4Xbxmj",
          "chunk-LD32UVVN.js": "sha384-cMDkEnV9e/Q9yUFkU3cu+KSnhMWxr6bxrnhU6VB7CknyIHiUa/y6LRBKwN0tz8xH",
          "chunk-QMUFVTBX.js": "sha384-plNIuPTM/YXql5lxO1VOKxG2hF8xcDcYMpAhcKwYK834U5Tg1qP+nkjEjBSCw2nA",
          "chunk-PZNONLPT.js": "sha384-4pfwS6qB3A6WkBSHMbpnPN98RADDbbpPZn2AEyrA85mDnDf94JDcadQCiJGzhvqU",
          "_angular_elements.ktmx-SsBF0.js": "sha384-flC1SAvuH5ArmiAaPpUqwrgNuM6wrx5B8Ai3mFA1u6J9Ul+RoIi5810kCxfcMTmi",
          "_angular_platform_browser.djzJcPG8PR.js": "sha384-IUG+PoEOrXUaMm+3zaFAg7DqbjYcgTQYz3lbcWEe0EMcczzhaNd/DQJcUcKzmmWX",
          "rxjs._3LcsHIuu_.js": "sha384-L6FQSdrrrGYaYs9+9CcMQJm6XdJmHdC5KI8LUqjCjiOy/P0uaipzfuDlZmgLD0EI",
          "rxjs_operators.G4NPpguNIR.js": "sha384-S9xR7Nx4g21P4vTeYNmL6c6r0DEhogAK05d1cDszxASo5/DkMsaNNFhzhBsGJISj",
          "chunk-64WOUHHJ.js": "sha384-hTdulOFDbDpZPDXTPSqo9asD5kf/Rb2nqqOwqK/IzWWXyf8kf0+N94FSvSjPLKtF",
          "tslib.BX2MinpEcV.js": "sha384-us48hLnAuTVi42myNvtbK0UsmSvbAjKfiZP4HjtL9tB6FogW0rizxqZPIRAbidzm",
          "_ng_internal_navigation-OWHOFU3J.js": "sha384-pDsF9OtGr8Gge3jMutXuLu4e2In15E66jxpB7tPyk1BWIGUzLunqomZ//ZWd8/IY",
          "_ng_internal_url-M3FP4EGB.js": "sha384-zCStSbNHKB7JrqDdJP0JOaWJQeQvZJG4D3ohz2BZ9zH2S5djt4JKrX8KLGBs6v1o",
          "_ng_internal_event_bus-537AN7RR.js": "sha384-AyZ2NnUEPoWCSnCBLX1TPcllA+8Z90xB8g6VDm4WFRTRDyCVHGchCJ3wYsR8MOrF",
          "_ng_internal_ui-ZT6YZN5Z.js": "sha384-HoOyyiouZiEN+2t/q1IUTqAOEYmzwSAifeT84sCcBC8cxuDZNcmvxESY6/ymwnfS",
          "mfe-home-QJGJZXVQ.js": "sha384-bPvrYcqo5RV4UiGMy7K73bly+X1tD6Gum4ui94h7mDf/o08ZdFyBm8J+YMC8Bi3o",
          "mfe-category-3SNGYRGZ.js": "sha384-4sIbMUY8O5CKwny2GkJItSkBDTBI6rKhW7nS2pgLqf1kGSK7CMK6aYoqrshyEMtH",
          "mfe-stores-SY4FLME3.js": "sha384-WM8tTXz1Z4jzZ2G9uA+1cDlcvI0Efmwg+4XwZYG92n8dEA+9Zk7FC8hiAD7IDqLr",
          "mfe-header-W2OE6E3A.js": "sha384-79TJiEsnvm5tCxtC9DsMZg2RHy0Qd8ubIc+5l1CydliIYr51DUrTadnpmoJk4JTp",
          "mfe-footer-7QGH7EAH.js": "sha384-fSeULQ4ahBEDp0tQldB17GE3ymt6d73SAbRtkZCvGe657MbgoomDTREuszSk+AEv",
          "mfe-recommendations-KZYO4SSQ.js": "sha384-kedQahOw9FMoYf5GiJPxlsX0OT4H8uLVub3lCGGw2omryN9k2MaMdlFnbmJHR54L",
          "mfe-store-picker-PCDPARLG.js": "sha384-RcveSy6/6Y0z4DiLmW4z/vEkR/DAitumonPfH8XybY8Fmb0825m5CJhCchEzpyO6",
          "nav-contribution-R3ZWNATU.js": "sha384-hjudg0sTBiC99QSo9zczR442+oqrFvOCG7RzyFsA2ovo7GsRAcRyx5tXSppiKnnz",
          "chunk-OZQ6JKLG.js": "sha384-EE7BH7bSlYWqlWwtX7XpM9W0PZ2//G7BqyakMEs/pFXcJ6+//8vSk6lTMHYireMh",
          "chunk-2TRNGCRW.js": "sha384-6hXJvFjPa/Ufsst94QotFiaYUAFrFFhAU7K03uURw2sZGyo064nsZ8xCev9jL6yz",
          "chunk-2VMXMS7J.js": "sha384-MbmUQ39oLPov5C9InEUR8yVadKAjZyiGDT3KYnTOmh2QKqme4N8P2KbWMIWeLdA6"
        }
      },
      "@tractor-store/decide": {
        "scopeUrl": "/playground/decide/",
        "exposes": [
          {
            "moduleName": "mfe-product",
            "file": "mfe-product-Z2FO2S6K.js"
          },
          {
            "moduleName": "nav-contribution",
            "file": "nav-contribution-URY657DC.js"
          }
        ],
        "integrity": {
          "_angular_common.G-CZnQLQoU.js": "sha384-YX2ZphvPB4ng+hlNirpK95UfvGpQow9JU0TyfSTTGZy82O4GxlbbYN+rYWwK9mHW",
          "_angular_common_http.rvzjQNS0mn.js": "sha384-o0Fnr++qML3pVU39/XDRf6DlF3BWq66xQ7tVOLwsGMzjrGPvMJdWtihsCSktEx1c",
          "chunk-MO7I3UEP.js": "sha384-ujSjhWs5fOkg33UJvC512MsRIUqQUYHZKuTDm7SHJl9qzXgRviKdIEXImm7uU9AG",
          "_angular_core.EWio10v_5e.js": "sha384-YsBiGZpPdvFiS6DVTBsh+GQaHFpzOuxK+I35TisMRO4R3QtNFQANk2RoPgpIpbG8",
          "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js": "sha384-5wVWeVYtx1cBT1jKmN8rQ7UM9OvfVXX8EiLwaa0Ske0MZEGspZWPPZzpPCmI7TvV",
          "_angular_core_primitives_di.HXp0bO89XM.js": "sha384-TjHSEGrEKJeSPDKQsgl6zRacbgz6jim9ccXHSpEMRsjHly2NLb+7gMPv7RVC93Yl",
          "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js": "sha384-37HVT8hkl0o/okswOrTWfkY0fqJJ++s3lwAoeJGPiYdE4ssP/c6e5PJdypaQ4kET",
          "chunk-6BOBWJD7.js": "sha384-TLRDiXCxEf2r27e9uCz825NMBKADrieMuQEIn+JVyD0mXZE/z2Pd299eq84Ms0dl",
          "_angular_core_primitives_signals.oN7Cdd5oIf.js": "sha384-7GrDDA4gZNuEkF1rR+65yxoNsOpJmdHpbkrmbo72XZEhX7BIK0TM/54kPthuaXmU",
          "_angular_core_rxjs_interop.Sn3puXfArQ.js": "sha384-Nbt6nd6pLUvIQKtCdUk1VZN5cBSoT5x5i0HMkS9b6/aNoU1mAdY9lQoCUHYJdHfy",
          "chunk-ZR2C3J5K.js": "sha384-FCW/XBFRyqVu+L7UP1kQ7QEQo3WW6K6hcahb2+qVhrxqS2n3ADadbK08fT4Xbxmj",
          "chunk-LD32UVVN.js": "sha384-cMDkEnV9e/Q9yUFkU3cu+KSnhMWxr6bxrnhU6VB7CknyIHiUa/y6LRBKwN0tz8xH",
          "chunk-QMUFVTBX.js": "sha384-plNIuPTM/YXql5lxO1VOKxG2hF8xcDcYMpAhcKwYK834U5Tg1qP+nkjEjBSCw2nA",
          "chunk-PZNONLPT.js": "sha384-4pfwS6qB3A6WkBSHMbpnPN98RADDbbpPZn2AEyrA85mDnDf94JDcadQCiJGzhvqU",
          "_angular_elements.ktmx-SsBF0.js": "sha384-flC1SAvuH5ArmiAaPpUqwrgNuM6wrx5B8Ai3mFA1u6J9Ul+RoIi5810kCxfcMTmi",
          "_angular_platform_browser.djzJcPG8PR.js": "sha384-IUG+PoEOrXUaMm+3zaFAg7DqbjYcgTQYz3lbcWEe0EMcczzhaNd/DQJcUcKzmmWX",
          "rxjs._3LcsHIuu_.js": "sha384-L6FQSdrrrGYaYs9+9CcMQJm6XdJmHdC5KI8LUqjCjiOy/P0uaipzfuDlZmgLD0EI",
          "rxjs_operators.G4NPpguNIR.js": "sha384-S9xR7Nx4g21P4vTeYNmL6c6r0DEhogAK05d1cDszxASo5/DkMsaNNFhzhBsGJISj",
          "chunk-64WOUHHJ.js": "sha384-hTdulOFDbDpZPDXTPSqo9asD5kf/Rb2nqqOwqK/IzWWXyf8kf0+N94FSvSjPLKtF",
          "tslib.BX2MinpEcV.js": "sha384-us48hLnAuTVi42myNvtbK0UsmSvbAjKfiZP4HjtL9tB6FogW0rizxqZPIRAbidzm",
          "_ng_internal_url-25LQ75X6.js": "sha384-8zb1x6m4HZb6LhpuUWtjc6bNaTyIRDuJ6D+lyK0gJNJqthFQOi9dwociprgQyzP6",
          "_ng_internal_navigation-PO74EY6Y.js": "sha384-MNjbUcH5rwAO40igbUfXL8UejyIJ0S2Cj6xqsqcWcgg+NFGLln0PJ3lGRCDD2v//",
          "_ng_internal_event_bus-T3PFMJ5X.js": "sha384-GEaq0dAByDUztioZmAVTNqL9kTsrwVB05N3ZilFx55ErnGp4D9TFUTeKvnG7BBoe",
          "mfe-product-Z2FO2S6K.js": "sha384-modeTKTc1cFixhjB/tuwz8zeXYwOVIL9dDgNSGk52eIDXTowyJUV8zg8dWrGkUAz",
          "nav-contribution-URY657DC.js": "sha384-dl7mQmKoNv7yNIEVoDVxJYej0xGruZAb6mHK5wZv4x9bFBY2t/no407NfTOIcpDm",
          "chunk-DUTPQ56Q.js": "sha384-SpzTuAJud/ZE8zVnFna/JoIhDjbzSJ59AxOF8OdnMIGPDdXfV9Sr2GCgojwClU3D"
        }
      },
      "@tractor-store/checkout": {
        "scopeUrl": "/playground/checkout/",
        "exposes": [
          {
            "moduleName": "mfe-cart",
            "file": "mfe-cart-64T76C25.js"
          },
          {
            "moduleName": "mfe-checkout",
            "file": "mfe-checkout-GQBIYLTK.js"
          },
          {
            "moduleName": "mfe-thanks",
            "file": "mfe-thanks-WWAFN7GC.js"
          },
          {
            "moduleName": "mfe-mini-cart",
            "file": "mfe-mini-cart-AMFV52KE.js"
          },
          {
            "moduleName": "mfe-add-to-cart",
            "file": "mfe-add-to-cart-FDBMIFST.js"
          },
          {
            "moduleName": "nav-contribution",
            "file": "nav-contribution-Y3U46EMY.js"
          }
        ],
        "integrity": {
          "_angular_common.G-CZnQLQoU.js": "sha384-YX2ZphvPB4ng+hlNirpK95UfvGpQow9JU0TyfSTTGZy82O4GxlbbYN+rYWwK9mHW",
          "_angular_common_http.rvzjQNS0mn.js": "sha384-o0Fnr++qML3pVU39/XDRf6DlF3BWq66xQ7tVOLwsGMzjrGPvMJdWtihsCSktEx1c",
          "chunk-MO7I3UEP.js": "sha384-ujSjhWs5fOkg33UJvC512MsRIUqQUYHZKuTDm7SHJl9qzXgRviKdIEXImm7uU9AG",
          "_angular_core.EWio10v_5e.js": "sha384-YsBiGZpPdvFiS6DVTBsh+GQaHFpzOuxK+I35TisMRO4R3QtNFQANk2RoPgpIpbG8",
          "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js": "sha384-5wVWeVYtx1cBT1jKmN8rQ7UM9OvfVXX8EiLwaa0Ske0MZEGspZWPPZzpPCmI7TvV",
          "_angular_core_primitives_di.HXp0bO89XM.js": "sha384-TjHSEGrEKJeSPDKQsgl6zRacbgz6jim9ccXHSpEMRsjHly2NLb+7gMPv7RVC93Yl",
          "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js": "sha384-37HVT8hkl0o/okswOrTWfkY0fqJJ++s3lwAoeJGPiYdE4ssP/c6e5PJdypaQ4kET",
          "chunk-6BOBWJD7.js": "sha384-TLRDiXCxEf2r27e9uCz825NMBKADrieMuQEIn+JVyD0mXZE/z2Pd299eq84Ms0dl",
          "_angular_core_primitives_signals.oN7Cdd5oIf.js": "sha384-7GrDDA4gZNuEkF1rR+65yxoNsOpJmdHpbkrmbo72XZEhX7BIK0TM/54kPthuaXmU",
          "_angular_core_rxjs_interop.Sn3puXfArQ.js": "sha384-Nbt6nd6pLUvIQKtCdUk1VZN5cBSoT5x5i0HMkS9b6/aNoU1mAdY9lQoCUHYJdHfy",
          "chunk-ZR2C3J5K.js": "sha384-FCW/XBFRyqVu+L7UP1kQ7QEQo3WW6K6hcahb2+qVhrxqS2n3ADadbK08fT4Xbxmj",
          "chunk-LD32UVVN.js": "sha384-cMDkEnV9e/Q9yUFkU3cu+KSnhMWxr6bxrnhU6VB7CknyIHiUa/y6LRBKwN0tz8xH",
          "chunk-QMUFVTBX.js": "sha384-plNIuPTM/YXql5lxO1VOKxG2hF8xcDcYMpAhcKwYK834U5Tg1qP+nkjEjBSCw2nA",
          "chunk-PZNONLPT.js": "sha384-4pfwS6qB3A6WkBSHMbpnPN98RADDbbpPZn2AEyrA85mDnDf94JDcadQCiJGzhvqU",
          "_angular_elements.ktmx-SsBF0.js": "sha384-flC1SAvuH5ArmiAaPpUqwrgNuM6wrx5B8Ai3mFA1u6J9Ul+RoIi5810kCxfcMTmi",
          "_angular_forms.UAUsqxOWM3.js": "sha384-RN8YTAMk0bxHDEK7vsy19QueAQD/Pzh3+C8gyL1FKhGlWIH6bRaZjuRaNuGqXKof",
          "_angular_platform_browser.djzJcPG8PR.js": "sha384-IUG+PoEOrXUaMm+3zaFAg7DqbjYcgTQYz3lbcWEe0EMcczzhaNd/DQJcUcKzmmWX",
          "rxjs._3LcsHIuu_.js": "sha384-L6FQSdrrrGYaYs9+9CcMQJm6XdJmHdC5KI8LUqjCjiOy/P0uaipzfuDlZmgLD0EI",
          "rxjs_operators.G4NPpguNIR.js": "sha384-S9xR7Nx4g21P4vTeYNmL6c6r0DEhogAK05d1cDszxASo5/DkMsaNNFhzhBsGJISj",
          "chunk-64WOUHHJ.js": "sha384-hTdulOFDbDpZPDXTPSqo9asD5kf/Rb2nqqOwqK/IzWWXyf8kf0+N94FSvSjPLKtF",
          "tslib.BX2MinpEcV.js": "sha384-us48hLnAuTVi42myNvtbK0UsmSvbAjKfiZP4HjtL9tB6FogW0rizxqZPIRAbidzm",
          "_ng_internal_ui-ZT6YZN5Z.js": "sha384-HoOyyiouZiEN+2t/q1IUTqAOEYmzwSAifeT84sCcBC8cxuDZNcmvxESY6/ymwnfS",
          "_ng_internal_navigation-OWHOFU3J.js": "sha384-pDsF9OtGr8Gge3jMutXuLu4e2In15E66jxpB7tPyk1BWIGUzLunqomZ//ZWd8/IY",
          "_ng_internal_url-M3FP4EGB.js": "sha384-zCStSbNHKB7JrqDdJP0JOaWJQeQvZJG4D3ohz2BZ9zH2S5djt4JKrX8KLGBs6v1o",
          "_ng_internal_event_bus-537AN7RR.js": "sha384-AyZ2NnUEPoWCSnCBLX1TPcllA+8Z90xB8g6VDm4WFRTRDyCVHGchCJ3wYsR8MOrF",
          "mfe-cart-64T76C25.js": "sha384-o/08JZXJI4IX6nOwiqqtGJNvXZmtkttDvM9PRDZTOXKkV/i0pH8oYYB2aAi0r9UA",
          "mfe-checkout-GQBIYLTK.js": "sha384-+onIt+KJ2wkjHcrhY7JW68z35BvYXvzjw68BwCxRCRhbzdCG0mUwBZgNOREfDk7/",
          "mfe-thanks-WWAFN7GC.js": "sha384-53czgP+0WGMEHCXoSzGgyNjn9lHK66AzqhCX/6ZtSUbwh99j8Q6VTuULp78Wlxfn",
          "mfe-mini-cart-AMFV52KE.js": "sha384-gGBzpNLwIUXn0i7EIw8nC6BVK5nW4in5JLj7uGnoG0xkOeKFpazVEAtsQm1D9CLx",
          "mfe-add-to-cart-FDBMIFST.js": "sha384-ZphE/B+4LOHk4zjbyaB8GMF1hst2hG0p7XFgftqcCEUzrVYqD5wMWSDfhaWO2484",
          "nav-contribution-Y3U46EMY.js": "sha384-bJHvIkBpPLDd9EADMbOFyE8jGAmgzpj2btSDlVzrfFCt3Bm6qEeUxsxZ6jNEQcKE",
          "chunk-HAURFVXL.js": "sha384-ijCh9YcKYcx1eQWhGHJDJXyJWWRwzIQLAb4jGjJwj5/PuPvgqVeo/weHXV9tBIBT",
          "chunk-IXVRQ3XI.js": "sha384-isAK0+MzGJzJndw+laXhLYBADqNo/BxIg/IbapvKoCllwjUl+Yy2Wh0MFt0wZPqX",
          "chunk-DDWWMX3L.js": "sha384-y5fRkstpEzberTAn+YJ/+etSy+OTbP3qN2ikAAfvOx7ru7ZA7+HhLk7xEl7usven",
          "chunk-SA4XMAC3.js": "sha384-nFOHlB1YFi/1qDCcMbTVX5eeurKr4kHbZmv9Ik6GzP7VaycBlENjZhyrt6s5+7Dx",
          "chunk-2VMXMS7J.js": "sha384-MbmUQ39oLPov5C9InEUR8yVadKAjZyiGDT3KYnTOmh2QKqme4N8P2KbWMIWeLdA6"
        }
      },
      "__NF-HOST__": {
        "scopeUrl": "./",
        "exposes": [],
        "integrity": {
          "_angular_common.G-CZnQLQoU.js": "sha384-YX2ZphvPB4ng+hlNirpK95UfvGpQow9JU0TyfSTTGZy82O4GxlbbYN+rYWwK9mHW",
          "_angular_common_http.rvzjQNS0mn.js": "sha384-o0Fnr++qML3pVU39/XDRf6DlF3BWq66xQ7tVOLwsGMzjrGPvMJdWtihsCSktEx1c",
          "chunk-MO7I3UEP.js": "sha384-ujSjhWs5fOkg33UJvC512MsRIUqQUYHZKuTDm7SHJl9qzXgRviKdIEXImm7uU9AG",
          "_angular_core.EWio10v_5e.js": "sha384-YsBiGZpPdvFiS6DVTBsh+GQaHFpzOuxK+I35TisMRO4R3QtNFQANk2RoPgpIpbG8",
          "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js": "sha384-5wVWeVYtx1cBT1jKmN8rQ7UM9OvfVXX8EiLwaa0Ske0MZEGspZWPPZzpPCmI7TvV",
          "_angular_core_primitives_di.HXp0bO89XM.js": "sha384-TjHSEGrEKJeSPDKQsgl6zRacbgz6jim9ccXHSpEMRsjHly2NLb+7gMPv7RVC93Yl",
          "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js": "sha384-37HVT8hkl0o/okswOrTWfkY0fqJJ++s3lwAoeJGPiYdE4ssP/c6e5PJdypaQ4kET",
          "chunk-6BOBWJD7.js": "sha384-TLRDiXCxEf2r27e9uCz825NMBKADrieMuQEIn+JVyD0mXZE/z2Pd299eq84Ms0dl",
          "_angular_core_primitives_signals.oN7Cdd5oIf.js": "sha384-7GrDDA4gZNuEkF1rR+65yxoNsOpJmdHpbkrmbo72XZEhX7BIK0TM/54kPthuaXmU",
          "_angular_core_rxjs_interop.Sn3puXfArQ.js": "sha384-Nbt6nd6pLUvIQKtCdUk1VZN5cBSoT5x5i0HMkS9b6/aNoU1mAdY9lQoCUHYJdHfy",
          "chunk-ZR2C3J5K.js": "sha384-FCW/XBFRyqVu+L7UP1kQ7QEQo3WW6K6hcahb2+qVhrxqS2n3ADadbK08fT4Xbxmj",
          "chunk-LD32UVVN.js": "sha384-cMDkEnV9e/Q9yUFkU3cu+KSnhMWxr6bxrnhU6VB7CknyIHiUa/y6LRBKwN0tz8xH",
          "chunk-QMUFVTBX.js": "sha384-plNIuPTM/YXql5lxO1VOKxG2hF8xcDcYMpAhcKwYK834U5Tg1qP+nkjEjBSCw2nA",
          "chunk-PZNONLPT.js": "sha384-4pfwS6qB3A6WkBSHMbpnPN98RADDbbpPZn2AEyrA85mDnDf94JDcadQCiJGzhvqU",
          "_angular_platform_browser.djzJcPG8PR.js": "sha384-IUG+PoEOrXUaMm+3zaFAg7DqbjYcgTQYz3lbcWEe0EMcczzhaNd/DQJcUcKzmmWX",
          "_angular_router.kRPE6gwl6L.js": "sha384-2U4xtKE/3y4O9JwCG/cIaOXMxldunU4y/R5ih7+Y7mS5h2JgsRrR5STbExEA2gsH",
          "rxjs._3LcsHIuu_.js": "sha384-L6FQSdrrrGYaYs9+9CcMQJm6XdJmHdC5KI8LUqjCjiOy/P0uaipzfuDlZmgLD0EI",
          "rxjs_operators.G4NPpguNIR.js": "sha384-S9xR7Nx4g21P4vTeYNmL6c6r0DEhogAK05d1cDszxASo5/DkMsaNNFhzhBsGJISj",
          "chunk-64WOUHHJ.js": "sha384-hTdulOFDbDpZPDXTPSqo9asD5kf/Rb2nqqOwqK/IzWWXyf8kf0+N94FSvSjPLKtF",
          "tslib.BX2MinpEcV.js": "sha384-us48hLnAuTVi42myNvtbK0UsmSvbAjKfiZP4HjtL9tB6FogW0rizxqZPIRAbidzm",
          "_ng_internal_event_bus-IIHRXBFG.js": "sha384-1e+/Aklfz+uexxTAKa1CWDZQhvRdlFLgi9BtUx7iaG2lk5mloYuCKkgIGIliCjvc",
          "_ng_internal_navigation-WQQSOTRO.js": "sha384-mG1SuHrk17+FICAppocZrchQkJwmPnZ+C2ZChnwPebqY9WIJSroNUcQ6ibq0JAl7",
          "_ng_internal_url-OGK476M3.js": "sha384-GHXC/1ffPyKU1JPkIQOwzywibLNCDWRtu5QpMQ132TNdH67o5doMSyR0WU/gOgSp",
          "_ng_internal_ui-JVYKD4IB.js": "sha384-jMnjqx6LmzCvb++81HtDTv1ML9V3LICiPOhmBlgh3mf5TeZofTz9TCRa5w9r2mMp"
        }
      }
    },
    "scopedExternals": {},
    "sharedExternals": {
      "__GLOBAL__": {
        "@angular/common": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/common": "_angular_common.G-CZnQLQoU.js",
                    "@angular/common/http": "_angular_common_http.rvzjQNS0mn.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_common",
                  "servedFiles": [
                    {
                      "entry": "@angular/common",
                      "file": "_angular_common.G-CZnQLQoU.js"
                    },
                    {
                      "entry": "@angular/common/http",
                      "file": "_angular_common_http.rvzjQNS0mn.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/common": "_angular_common.G-CZnQLQoU.js",
                    "@angular/common/http": "_angular_common_http.rvzjQNS0mn.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_common",
                  "servedFiles": [
                    {
                      "entry": "@angular/common",
                      "file": "_angular_common.G-CZnQLQoU.js"
                    },
                    {
                      "entry": "@angular/common/http",
                      "file": "_angular_common_http.rvzjQNS0mn.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/common": "_angular_common.G-CZnQLQoU.js",
                    "@angular/common/http": "_angular_common_http.rvzjQNS0mn.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_common",
                  "servedFiles": [
                    {
                      "entry": "@angular/common",
                      "file": "_angular_common.G-CZnQLQoU.js"
                    },
                    {
                      "entry": "@angular/common/http",
                      "file": "_angular_common_http.rvzjQNS0mn.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/common": "_angular_common.G-CZnQLQoU.js",
                    "@angular/common/http": "_angular_common_http.rvzjQNS0mn.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_common",
                  "servedFiles": [
                    {
                      "entry": "@angular/common",
                      "file": "_angular_common.G-CZnQLQoU.js"
                    },
                    {
                      "entry": "@angular/common/http",
                      "file": "_angular_common_http.rvzjQNS0mn.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@angular/core": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/core": "_angular_core.EWio10v_5e.js",
                    "@angular/core/event-dispatch-contract.min.js": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js",
                    "@angular/core/primitives/di": "_angular_core_primitives_di.HXp0bO89XM.js",
                    "@angular/core/primitives/event-dispatch": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js",
                    "@angular/core/primitives/signals": "_angular_core_primitives_signals.oN7Cdd5oIf.js",
                    "@angular/core/rxjs-interop": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_core",
                  "servedFiles": [
                    {
                      "entry": "@angular/core",
                      "file": "_angular_core.EWio10v_5e.js"
                    },
                    {
                      "entry": "@angular/core/event-dispatch-contract.min.js",
                      "file": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
                    },
                    {
                      "entry": "@angular/core/primitives/di",
                      "file": "_angular_core_primitives_di.HXp0bO89XM.js"
                    },
                    {
                      "entry": "@angular/core/primitives/event-dispatch",
                      "file": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
                    },
                    {
                      "entry": "@angular/core/primitives/signals",
                      "file": "_angular_core_primitives_signals.oN7Cdd5oIf.js"
                    },
                    {
                      "entry": "@angular/core/rxjs-interop",
                      "file": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/core": "_angular_core.EWio10v_5e.js",
                    "@angular/core/event-dispatch-contract.min.js": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js",
                    "@angular/core/primitives/di": "_angular_core_primitives_di.HXp0bO89XM.js",
                    "@angular/core/primitives/event-dispatch": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js",
                    "@angular/core/primitives/signals": "_angular_core_primitives_signals.oN7Cdd5oIf.js",
                    "@angular/core/rxjs-interop": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_core",
                  "servedFiles": [
                    {
                      "entry": "@angular/core",
                      "file": "_angular_core.EWio10v_5e.js"
                    },
                    {
                      "entry": "@angular/core/event-dispatch-contract.min.js",
                      "file": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
                    },
                    {
                      "entry": "@angular/core/primitives/di",
                      "file": "_angular_core_primitives_di.HXp0bO89XM.js"
                    },
                    {
                      "entry": "@angular/core/primitives/event-dispatch",
                      "file": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
                    },
                    {
                      "entry": "@angular/core/primitives/signals",
                      "file": "_angular_core_primitives_signals.oN7Cdd5oIf.js"
                    },
                    {
                      "entry": "@angular/core/rxjs-interop",
                      "file": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/core": "_angular_core.EWio10v_5e.js",
                    "@angular/core/event-dispatch-contract.min.js": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js",
                    "@angular/core/primitives/di": "_angular_core_primitives_di.HXp0bO89XM.js",
                    "@angular/core/primitives/event-dispatch": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js",
                    "@angular/core/primitives/signals": "_angular_core_primitives_signals.oN7Cdd5oIf.js",
                    "@angular/core/rxjs-interop": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_core",
                  "servedFiles": [
                    {
                      "entry": "@angular/core",
                      "file": "_angular_core.EWio10v_5e.js"
                    },
                    {
                      "entry": "@angular/core/event-dispatch-contract.min.js",
                      "file": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
                    },
                    {
                      "entry": "@angular/core/primitives/di",
                      "file": "_angular_core_primitives_di.HXp0bO89XM.js"
                    },
                    {
                      "entry": "@angular/core/primitives/event-dispatch",
                      "file": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
                    },
                    {
                      "entry": "@angular/core/primitives/signals",
                      "file": "_angular_core_primitives_signals.oN7Cdd5oIf.js"
                    },
                    {
                      "entry": "@angular/core/rxjs-interop",
                      "file": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/core": "_angular_core.EWio10v_5e.js",
                    "@angular/core/event-dispatch-contract.min.js": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js",
                    "@angular/core/primitives/di": "_angular_core_primitives_di.HXp0bO89XM.js",
                    "@angular/core/primitives/event-dispatch": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js",
                    "@angular/core/primitives/signals": "_angular_core_primitives_signals.oN7Cdd5oIf.js",
                    "@angular/core/rxjs-interop": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_core",
                  "servedFiles": [
                    {
                      "entry": "@angular/core",
                      "file": "_angular_core.EWio10v_5e.js"
                    },
                    {
                      "entry": "@angular/core/event-dispatch-contract.min.js",
                      "file": "_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
                    },
                    {
                      "entry": "@angular/core/primitives/di",
                      "file": "_angular_core_primitives_di.HXp0bO89XM.js"
                    },
                    {
                      "entry": "@angular/core/primitives/event-dispatch",
                      "file": "_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
                    },
                    {
                      "entry": "@angular/core/primitives/signals",
                      "file": "_angular_core_primitives_signals.oN7Cdd5oIf.js"
                    },
                    {
                      "entry": "@angular/core/rxjs-interop",
                      "file": "_angular_core_rxjs_interop.Sn3puXfArQ.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@angular/elements": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": false,
              "remotes": [
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/elements": "_angular_elements.ktmx-SsBF0.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_elements",
                  "servedFiles": [
                    {
                      "entry": "@angular/elements",
                      "file": "_angular_elements.ktmx-SsBF0.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/elements": "_angular_elements.ktmx-SsBF0.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_elements",
                  "servedFiles": [
                    {
                      "entry": "@angular/elements",
                      "file": "_angular_elements.ktmx-SsBF0.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/elements": "_angular_elements.ktmx-SsBF0.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_elements",
                  "servedFiles": [
                    {
                      "entry": "@angular/elements",
                      "file": "_angular_elements.ktmx-SsBF0.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@angular/platform-browser": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/platform-browser": "_angular_platform_browser.djzJcPG8PR.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_platform_browser",
                  "servedFiles": [
                    {
                      "entry": "@angular/platform-browser",
                      "file": "_angular_platform_browser.djzJcPG8PR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/platform-browser": "_angular_platform_browser.djzJcPG8PR.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_platform_browser",
                  "servedFiles": [
                    {
                      "entry": "@angular/platform-browser",
                      "file": "_angular_platform_browser.djzJcPG8PR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/platform-browser": "_angular_platform_browser.djzJcPG8PR.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_platform_browser",
                  "servedFiles": [
                    {
                      "entry": "@angular/platform-browser",
                      "file": "_angular_platform_browser.djzJcPG8PR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/platform-browser": "_angular_platform_browser.djzJcPG8PR.js"
                  },
                  "cached": false,
                  "bundle": "browser-angular_platform_browser",
                  "servedFiles": [
                    {
                      "entry": "@angular/platform-browser",
                      "file": "_angular_platform_browser.djzJcPG8PR.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "rxjs": {
          "dirty": false,
          "versions": [
            {
              "tag": "7.8.2",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~7.8.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "rxjs": "rxjs._3LcsHIuu_.js",
                    "rxjs/operators": "rxjs_operators.G4NPpguNIR.js"
                  },
                  "cached": true,
                  "bundle": "browser-rxjs",
                  "servedFiles": [
                    {
                      "entry": "rxjs",
                      "file": "rxjs._3LcsHIuu_.js"
                    },
                    {
                      "entry": "rxjs/operators",
                      "file": "rxjs_operators.G4NPpguNIR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~7.8.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "rxjs": "rxjs._3LcsHIuu_.js",
                    "rxjs/operators": "rxjs_operators.G4NPpguNIR.js"
                  },
                  "cached": false,
                  "bundle": "browser-rxjs",
                  "servedFiles": [
                    {
                      "entry": "rxjs",
                      "file": "rxjs._3LcsHIuu_.js"
                    },
                    {
                      "entry": "rxjs/operators",
                      "file": "rxjs_operators.G4NPpguNIR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~7.8.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "rxjs": "rxjs._3LcsHIuu_.js",
                    "rxjs/operators": "rxjs_operators.G4NPpguNIR.js"
                  },
                  "cached": false,
                  "bundle": "browser-rxjs",
                  "servedFiles": [
                    {
                      "entry": "rxjs",
                      "file": "rxjs._3LcsHIuu_.js"
                    },
                    {
                      "entry": "rxjs/operators",
                      "file": "rxjs_operators.G4NPpguNIR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~7.8.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "rxjs": "rxjs._3LcsHIuu_.js",
                    "rxjs/operators": "rxjs_operators.G4NPpguNIR.js"
                  },
                  "cached": false,
                  "bundle": "browser-rxjs",
                  "servedFiles": [
                    {
                      "entry": "rxjs",
                      "file": "rxjs._3LcsHIuu_.js"
                    },
                    {
                      "entry": "rxjs/operators",
                      "file": "rxjs_operators.G4NPpguNIR.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "tslib": {
          "dirty": false,
          "versions": [
            {
              "tag": "2.8.1",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "^2.3.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "tslib": "tslib.BX2MinpEcV.js"
                  },
                  "cached": true,
                  "bundle": "browser-tslib",
                  "servedFiles": [
                    {
                      "entry": "tslib",
                      "file": "tslib.BX2MinpEcV.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "^2.3.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "tslib": "tslib.BX2MinpEcV.js"
                  },
                  "cached": false,
                  "bundle": "browser-tslib",
                  "servedFiles": [
                    {
                      "entry": "tslib",
                      "file": "tslib.BX2MinpEcV.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "^2.3.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "tslib": "tslib.BX2MinpEcV.js"
                  },
                  "cached": false,
                  "bundle": "browser-tslib",
                  "servedFiles": [
                    {
                      "entry": "tslib",
                      "file": "tslib.BX2MinpEcV.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "^2.3.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "tslib": "tslib.BX2MinpEcV.js"
                  },
                  "cached": false,
                  "bundle": "browser-tslib",
                  "servedFiles": [
                    {
                      "entry": "tslib",
                      "file": "tslib.BX2MinpEcV.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@ng-internal/navigation": {
          "dirty": false,
          "versions": [
            {
              "tag": "0.0.1",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/navigation": "_ng_internal_navigation-WQQSOTRO.js"
                  },
                  "cached": true,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/navigation",
                      "file": "_ng_internal_navigation-WQQSOTRO.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/navigation": "_ng_internal_navigation-OWHOFU3J.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/navigation",
                      "file": "_ng_internal_navigation-OWHOFU3J.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/navigation": "_ng_internal_navigation-PO74EY6Y.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/navigation",
                      "file": "_ng_internal_navigation-PO74EY6Y.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/navigation": "_ng_internal_navigation-OWHOFU3J.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/navigation",
                      "file": "_ng_internal_navigation-OWHOFU3J.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@ng-internal/url": {
          "dirty": false,
          "versions": [
            {
              "tag": "0.0.1",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/url": "_ng_internal_url-OGK476M3.js"
                  },
                  "cached": true,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/url",
                      "file": "_ng_internal_url-OGK476M3.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/url": "_ng_internal_url-M3FP4EGB.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/url",
                      "file": "_ng_internal_url-M3FP4EGB.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/url": "_ng_internal_url-25LQ75X6.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/url",
                      "file": "_ng_internal_url-25LQ75X6.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/url": "_ng_internal_url-M3FP4EGB.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/url",
                      "file": "_ng_internal_url-M3FP4EGB.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@ng-internal/event-bus": {
          "dirty": false,
          "versions": [
            {
              "tag": "0.0.1",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/event-bus": "_ng_internal_event_bus-IIHRXBFG.js"
                  },
                  "cached": true,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/event-bus",
                      "file": "_ng_internal_event_bus-IIHRXBFG.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/event-bus": "_ng_internal_event_bus-537AN7RR.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/event-bus",
                      "file": "_ng_internal_event_bus-537AN7RR.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/decide",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/event-bus": "_ng_internal_event_bus-T3PFMJ5X.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/event-bus",
                      "file": "_ng_internal_event_bus-T3PFMJ5X.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/event-bus": "_ng_internal_event_bus-537AN7RR.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/event-bus",
                      "file": "_ng_internal_event_bus-537AN7RR.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@ng-internal/ui": {
          "dirty": false,
          "versions": [
            {
              "tag": "0.0.1",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/ui": "_ng_internal_ui-JVYKD4IB.js"
                  },
                  "cached": true,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/ui",
                      "file": "_ng_internal_ui-JVYKD4IB.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/explore",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/ui": "_ng_internal_ui-ZT6YZN5Z.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/ui",
                      "file": "_ng_internal_ui-ZT6YZN5Z.js"
                    }
                  ],
                  "generation": "v4.5"
                },
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~0.0.1",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@ng-internal/ui": "_ng_internal_ui-ZT6YZN5Z.js"
                  },
                  "cached": false,
                  "bundle": null,
                  "servedFiles": [
                    {
                      "entry": "@ng-internal/ui",
                      "file": "_ng_internal_ui-ZT6YZN5Z.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@angular/forms": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": false,
              "remotes": [
                {
                  "name": "@tractor-store/checkout",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/forms": "_angular_forms.UAUsqxOWM3.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_forms",
                  "servedFiles": [
                    {
                      "entry": "@angular/forms",
                      "file": "_angular_forms.UAUsqxOWM3.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        },
        "@angular/router": {
          "dirty": false,
          "versions": [
            {
              "tag": "22.0.8",
              "action": "share",
              "host": true,
              "remotes": [
                {
                  "name": "__NF-HOST__",
                  "requiredVersion": "~22.0.0",
                  "strictVersion": true,
                  "file": null,
                  "entries": {
                    "@angular/router": "_angular_router.kRPE6gwl6L.js"
                  },
                  "cached": true,
                  "bundle": "browser-angular_router",
                  "servedFiles": [
                    {
                      "entry": "@angular/router",
                      "file": "_angular_router.kRPE6gwl6L.js"
                    }
                  ],
                  "generation": "v4.5"
                }
              ]
            }
          ]
        }
      }
    },
    "sharedChunks": {
      "@tractor-store/explore": {
        "browser-angular_common": [
          "chunk-MO7I3UEP.js"
        ],
        "browser-angular_core": [
          "chunk-6BOBWJD7.js",
          "chunk-ZR2C3J5K.js",
          "chunk-LD32UVVN.js",
          "chunk-QMUFVTBX.js",
          "chunk-PZNONLPT.js"
        ],
        "browser-rxjs": [
          "chunk-64WOUHHJ.js"
        ],
        "mapping-or-exposed": [
          "chunk-OZQ6JKLG.js",
          "chunk-2TRNGCRW.js",
          "chunk-2VMXMS7J.js"
        ]
      },
      "@tractor-store/decide": {
        "browser-angular_common": [
          "chunk-MO7I3UEP.js"
        ],
        "browser-angular_core": [
          "chunk-6BOBWJD7.js",
          "chunk-ZR2C3J5K.js",
          "chunk-LD32UVVN.js",
          "chunk-QMUFVTBX.js",
          "chunk-PZNONLPT.js"
        ],
        "browser-rxjs": [
          "chunk-64WOUHHJ.js"
        ],
        "mapping-or-exposed": [
          "chunk-DUTPQ56Q.js"
        ]
      },
      "@tractor-store/checkout": {
        "browser-angular_common": [
          "chunk-MO7I3UEP.js"
        ],
        "browser-angular_core": [
          "chunk-6BOBWJD7.js",
          "chunk-ZR2C3J5K.js",
          "chunk-LD32UVVN.js",
          "chunk-QMUFVTBX.js",
          "chunk-PZNONLPT.js"
        ],
        "browser-rxjs": [
          "chunk-64WOUHHJ.js"
        ],
        "mapping-or-exposed": [
          "chunk-HAURFVXL.js",
          "chunk-IXVRQ3XI.js",
          "chunk-DDWWMX3L.js",
          "chunk-SA4XMAC3.js",
          "chunk-2VMXMS7J.js"
        ]
      },
      "__NF-HOST__": {
        "browser-angular_common": [
          "chunk-MO7I3UEP.js"
        ],
        "browser-angular_core": [
          "chunk-6BOBWJD7.js",
          "chunk-ZR2C3J5K.js",
          "chunk-LD32UVVN.js",
          "chunk-QMUFVTBX.js",
          "chunk-PZNONLPT.js"
        ],
        "browser-rxjs": [
          "chunk-64WOUHHJ.js"
        ],
        "mapping-or-exposed": []
      }
    },
    "generation": "v4.5"
  },
  "importMaps": {
    "documentMaps": [
      {
        "kind": "importmap-shim",
        "parsed": true,
        "importCount": 35,
        "scopeCount": 4,
        "imports": [
          {
            "specifier": "@angular/common",
            "target": "./_angular_common.G-CZnQLQoU.js"
          },
          {
            "specifier": "@angular/common/http",
            "target": "./_angular_common_http.rvzjQNS0mn.js"
          },
          {
            "specifier": "@angular/core",
            "target": "./_angular_core.EWio10v_5e.js"
          },
          {
            "specifier": "@angular/core/event-dispatch-contract.min.js",
            "target": "./_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
          },
          {
            "specifier": "@angular/core/primitives/di",
            "target": "./_angular_core_primitives_di.HXp0bO89XM.js"
          },
          {
            "specifier": "@angular/core/primitives/event-dispatch",
            "target": "./_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
          },
          {
            "specifier": "@angular/core/primitives/signals",
            "target": "./_angular_core_primitives_signals.oN7Cdd5oIf.js"
          },
          {
            "specifier": "@angular/core/rxjs-interop",
            "target": "./_angular_core_rxjs_interop.Sn3puXfArQ.js"
          },
          {
            "specifier": "@angular/elements",
            "target": "/playground/explore/_angular_elements.ktmx-SsBF0.js"
          },
          {
            "specifier": "@angular/platform-browser",
            "target": "./_angular_platform_browser.djzJcPG8PR.js"
          },
          {
            "specifier": "rxjs",
            "target": "./rxjs._3LcsHIuu_.js"
          },
          {
            "specifier": "rxjs/operators",
            "target": "./rxjs_operators.G4NPpguNIR.js"
          },
          {
            "specifier": "tslib",
            "target": "./tslib.BX2MinpEcV.js"
          },
          {
            "specifier": "@ng-internal/navigation",
            "target": "./_ng_internal_navigation-WQQSOTRO.js"
          },
          {
            "specifier": "@ng-internal/url",
            "target": "./_ng_internal_url-OGK476M3.js"
          },
          {
            "specifier": "@ng-internal/event-bus",
            "target": "./_ng_internal_event_bus-IIHRXBFG.js"
          },
          {
            "specifier": "@ng-internal/ui",
            "target": "./_ng_internal_ui-JVYKD4IB.js"
          },
          {
            "specifier": "@angular/forms",
            "target": "/playground/checkout/_angular_forms.UAUsqxOWM3.js"
          },
          {
            "specifier": "@angular/router",
            "target": "./_angular_router.kRPE6gwl6L.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-home",
            "target": "/playground/explore/mfe-home-QJGJZXVQ.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-category",
            "target": "/playground/explore/mfe-category-3SNGYRGZ.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-stores",
            "target": "/playground/explore/mfe-stores-SY4FLME3.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-header",
            "target": "/playground/explore/mfe-header-W2OE6E3A.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-footer",
            "target": "/playground/explore/mfe-footer-7QGH7EAH.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-recommendations",
            "target": "/playground/explore/mfe-recommendations-KZYO4SSQ.js"
          },
          {
            "specifier": "@tractor-store/explore/mfe-store-picker",
            "target": "/playground/explore/mfe-store-picker-PCDPARLG.js"
          },
          {
            "specifier": "@tractor-store/explore/nav-contribution",
            "target": "/playground/explore/nav-contribution-R3ZWNATU.js"
          },
          {
            "specifier": "@tractor-store/decide/mfe-product",
            "target": "/playground/decide/mfe-product-Z2FO2S6K.js"
          },
          {
            "specifier": "@tractor-store/decide/nav-contribution",
            "target": "/playground/decide/nav-contribution-URY657DC.js"
          },
          {
            "specifier": "@tractor-store/checkout/mfe-cart",
            "target": "/playground/checkout/mfe-cart-64T76C25.js"
          },
          {
            "specifier": "@tractor-store/checkout/mfe-checkout",
            "target": "/playground/checkout/mfe-checkout-GQBIYLTK.js"
          },
          {
            "specifier": "@tractor-store/checkout/mfe-thanks",
            "target": "/playground/checkout/mfe-thanks-WWAFN7GC.js"
          },
          {
            "specifier": "@tractor-store/checkout/mfe-mini-cart",
            "target": "/playground/checkout/mfe-mini-cart-AMFV52KE.js"
          },
          {
            "specifier": "@tractor-store/checkout/mfe-add-to-cart",
            "target": "/playground/checkout/mfe-add-to-cart-FDBMIFST.js"
          },
          {
            "specifier": "@tractor-store/checkout/nav-contribution",
            "target": "/playground/checkout/nav-contribution-Y3U46EMY.js"
          }
        ],
        "scopes": [
          {
            "scope": "./",
            "imports": [
              {
                "specifier": "@nf-internal/chunk-MO7I3UEP",
                "target": "./chunk-MO7I3UEP.js"
              },
              {
                "specifier": "@nf-internal/chunk-6BOBWJD7",
                "target": "./chunk-6BOBWJD7.js"
              },
              {
                "specifier": "@nf-internal/chunk-ZR2C3J5K",
                "target": "./chunk-ZR2C3J5K.js"
              },
              {
                "specifier": "@nf-internal/chunk-LD32UVVN",
                "target": "./chunk-LD32UVVN.js"
              },
              {
                "specifier": "@nf-internal/chunk-QMUFVTBX",
                "target": "./chunk-QMUFVTBX.js"
              },
              {
                "specifier": "@nf-internal/chunk-PZNONLPT",
                "target": "./chunk-PZNONLPT.js"
              },
              {
                "specifier": "@nf-internal/chunk-64WOUHHJ",
                "target": "./chunk-64WOUHHJ.js"
              }
            ]
          },
          {
            "scope": "/playground/explore/",
            "imports": [
              {
                "specifier": "@nf-internal/chunk-OZQ6JKLG",
                "target": "/playground/explore/chunk-OZQ6JKLG.js"
              },
              {
                "specifier": "@nf-internal/chunk-2TRNGCRW",
                "target": "/playground/explore/chunk-2TRNGCRW.js"
              },
              {
                "specifier": "@nf-internal/chunk-2VMXMS7J",
                "target": "/playground/explore/chunk-2VMXMS7J.js"
              }
            ]
          },
          {
            "scope": "/playground/checkout/",
            "imports": [
              {
                "specifier": "@nf-internal/chunk-HAURFVXL",
                "target": "/playground/checkout/chunk-HAURFVXL.js"
              },
              {
                "specifier": "@nf-internal/chunk-IXVRQ3XI",
                "target": "/playground/checkout/chunk-IXVRQ3XI.js"
              },
              {
                "specifier": "@nf-internal/chunk-DDWWMX3L",
                "target": "/playground/checkout/chunk-DDWWMX3L.js"
              },
              {
                "specifier": "@nf-internal/chunk-SA4XMAC3",
                "target": "/playground/checkout/chunk-SA4XMAC3.js"
              },
              {
                "specifier": "@nf-internal/chunk-2VMXMS7J",
                "target": "/playground/checkout/chunk-2VMXMS7J.js"
              }
            ]
          },
          {
            "scope": "/playground/decide/",
            "imports": [
              {
                "specifier": "@nf-internal/chunk-DUTPQ56Q",
                "target": "/playground/decide/chunk-DUTPQ56Q.js"
              }
            ]
          }
        ],
        "integrity": {
          "./_angular_common.G-CZnQLQoU.js": "sha384-YX2ZphvPB4ng+hlNirpK95UfvGpQow9JU0TyfSTTGZy82O4GxlbbYN+rYWwK9mHW",
          "./_angular_common_http.rvzjQNS0mn.js": "sha384-o0Fnr++qML3pVU39/XDRf6DlF3BWq66xQ7tVOLwsGMzjrGPvMJdWtihsCSktEx1c",
          "./_angular_core.EWio10v_5e.js": "sha384-YsBiGZpPdvFiS6DVTBsh+GQaHFpzOuxK+I35TisMRO4R3QtNFQANk2RoPgpIpbG8",
          "./_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js": "sha384-5wVWeVYtx1cBT1jKmN8rQ7UM9OvfVXX8EiLwaa0Ske0MZEGspZWPPZzpPCmI7TvV",
          "./_angular_core_primitives_di.HXp0bO89XM.js": "sha384-TjHSEGrEKJeSPDKQsgl6zRacbgz6jim9ccXHSpEMRsjHly2NLb+7gMPv7RVC93Yl",
          "./_angular_core_primitives_event_dispatch.8Y6FZIJL61.js": "sha384-37HVT8hkl0o/okswOrTWfkY0fqJJ++s3lwAoeJGPiYdE4ssP/c6e5PJdypaQ4kET",
          "./_angular_core_primitives_signals.oN7Cdd5oIf.js": "sha384-7GrDDA4gZNuEkF1rR+65yxoNsOpJmdHpbkrmbo72XZEhX7BIK0TM/54kPthuaXmU",
          "./_angular_core_rxjs_interop.Sn3puXfArQ.js": "sha384-Nbt6nd6pLUvIQKtCdUk1VZN5cBSoT5x5i0HMkS9b6/aNoU1mAdY9lQoCUHYJdHfy",
          "/playground/explore/_angular_elements.ktmx-SsBF0.js": "sha384-flC1SAvuH5ArmiAaPpUqwrgNuM6wrx5B8Ai3mFA1u6J9Ul+RoIi5810kCxfcMTmi",
          "./_angular_platform_browser.djzJcPG8PR.js": "sha384-IUG+PoEOrXUaMm+3zaFAg7DqbjYcgTQYz3lbcWEe0EMcczzhaNd/DQJcUcKzmmWX",
          "./rxjs._3LcsHIuu_.js": "sha384-L6FQSdrrrGYaYs9+9CcMQJm6XdJmHdC5KI8LUqjCjiOy/P0uaipzfuDlZmgLD0EI",
          "./rxjs_operators.G4NPpguNIR.js": "sha384-S9xR7Nx4g21P4vTeYNmL6c6r0DEhogAK05d1cDszxASo5/DkMsaNNFhzhBsGJISj",
          "./tslib.BX2MinpEcV.js": "sha384-us48hLnAuTVi42myNvtbK0UsmSvbAjKfiZP4HjtL9tB6FogW0rizxqZPIRAbidzm",
          "./_ng_internal_navigation-WQQSOTRO.js": "sha384-mG1SuHrk17+FICAppocZrchQkJwmPnZ+C2ZChnwPebqY9WIJSroNUcQ6ibq0JAl7",
          "./_ng_internal_url-OGK476M3.js": "sha384-GHXC/1ffPyKU1JPkIQOwzywibLNCDWRtu5QpMQ132TNdH67o5doMSyR0WU/gOgSp",
          "./_ng_internal_event_bus-IIHRXBFG.js": "sha384-1e+/Aklfz+uexxTAKa1CWDZQhvRdlFLgi9BtUx7iaG2lk5mloYuCKkgIGIliCjvc",
          "./_ng_internal_ui-JVYKD4IB.js": "sha384-jMnjqx6LmzCvb++81HtDTv1ML9V3LICiPOhmBlgh3mf5TeZofTz9TCRa5w9r2mMp",
          "/playground/checkout/_angular_forms.UAUsqxOWM3.js": "sha384-RN8YTAMk0bxHDEK7vsy19QueAQD/Pzh3+C8gyL1FKhGlWIH6bRaZjuRaNuGqXKof",
          "./_angular_router.kRPE6gwl6L.js": "sha384-2U4xtKE/3y4O9JwCG/cIaOXMxldunU4y/R5ih7+Y7mS5h2JgsRrR5STbExEA2gsH",
          "/playground/explore/mfe-home-QJGJZXVQ.js": "sha384-bPvrYcqo5RV4UiGMy7K73bly+X1tD6Gum4ui94h7mDf/o08ZdFyBm8J+YMC8Bi3o",
          "/playground/explore/mfe-category-3SNGYRGZ.js": "sha384-4sIbMUY8O5CKwny2GkJItSkBDTBI6rKhW7nS2pgLqf1kGSK7CMK6aYoqrshyEMtH",
          "/playground/explore/mfe-stores-SY4FLME3.js": "sha384-WM8tTXz1Z4jzZ2G9uA+1cDlcvI0Efmwg+4XwZYG92n8dEA+9Zk7FC8hiAD7IDqLr",
          "/playground/explore/mfe-header-W2OE6E3A.js": "sha384-79TJiEsnvm5tCxtC9DsMZg2RHy0Qd8ubIc+5l1CydliIYr51DUrTadnpmoJk4JTp",
          "/playground/explore/mfe-footer-7QGH7EAH.js": "sha384-fSeULQ4ahBEDp0tQldB17GE3ymt6d73SAbRtkZCvGe657MbgoomDTREuszSk+AEv",
          "/playground/explore/mfe-recommendations-KZYO4SSQ.js": "sha384-kedQahOw9FMoYf5GiJPxlsX0OT4H8uLVub3lCGGw2omryN9k2MaMdlFnbmJHR54L",
          "/playground/explore/mfe-store-picker-PCDPARLG.js": "sha384-RcveSy6/6Y0z4DiLmW4z/vEkR/DAitumonPfH8XybY8Fmb0825m5CJhCchEzpyO6",
          "/playground/explore/nav-contribution-R3ZWNATU.js": "sha384-hjudg0sTBiC99QSo9zczR442+oqrFvOCG7RzyFsA2ovo7GsRAcRyx5tXSppiKnnz",
          "/playground/decide/mfe-product-Z2FO2S6K.js": "sha384-modeTKTc1cFixhjB/tuwz8zeXYwOVIL9dDgNSGk52eIDXTowyJUV8zg8dWrGkUAz",
          "/playground/decide/nav-contribution-URY657DC.js": "sha384-dl7mQmKoNv7yNIEVoDVxJYej0xGruZAb6mHK5wZv4x9bFBY2t/no407NfTOIcpDm",
          "/playground/checkout/mfe-cart-64T76C25.js": "sha384-o/08JZXJI4IX6nOwiqqtGJNvXZmtkttDvM9PRDZTOXKkV/i0pH8oYYB2aAi0r9UA",
          "/playground/checkout/mfe-checkout-GQBIYLTK.js": "sha384-+onIt+KJ2wkjHcrhY7JW68z35BvYXvzjw68BwCxRCRhbzdCG0mUwBZgNOREfDk7/",
          "/playground/checkout/mfe-thanks-WWAFN7GC.js": "sha384-53czgP+0WGMEHCXoSzGgyNjn9lHK66AzqhCX/6ZtSUbwh99j8Q6VTuULp78Wlxfn",
          "/playground/checkout/mfe-mini-cart-AMFV52KE.js": "sha384-gGBzpNLwIUXn0i7EIw8nC6BVK5nW4in5JLj7uGnoG0xkOeKFpazVEAtsQm1D9CLx",
          "/playground/checkout/mfe-add-to-cart-FDBMIFST.js": "sha384-ZphE/B+4LOHk4zjbyaB8GMF1hst2hG0p7XFgftqcCEUzrVYqD5wMWSDfhaWO2484",
          "/playground/checkout/nav-contribution-Y3U46EMY.js": "sha384-bJHvIkBpPLDd9EADMbOFyE8jGAmgzpj2btSDlVzrfFCt3Bm6qEeUxsxZ6jNEQcKE",
          "./chunk-MO7I3UEP.js": "sha384-ujSjhWs5fOkg33UJvC512MsRIUqQUYHZKuTDm7SHJl9qzXgRviKdIEXImm7uU9AG",
          "./chunk-6BOBWJD7.js": "sha384-TLRDiXCxEf2r27e9uCz825NMBKADrieMuQEIn+JVyD0mXZE/z2Pd299eq84Ms0dl",
          "./chunk-ZR2C3J5K.js": "sha384-FCW/XBFRyqVu+L7UP1kQ7QEQo3WW6K6hcahb2+qVhrxqS2n3ADadbK08fT4Xbxmj",
          "./chunk-LD32UVVN.js": "sha384-cMDkEnV9e/Q9yUFkU3cu+KSnhMWxr6bxrnhU6VB7CknyIHiUa/y6LRBKwN0tz8xH",
          "./chunk-QMUFVTBX.js": "sha384-plNIuPTM/YXql5lxO1VOKxG2hF8xcDcYMpAhcKwYK834U5Tg1qP+nkjEjBSCw2nA",
          "./chunk-PZNONLPT.js": "sha384-4pfwS6qB3A6WkBSHMbpnPN98RADDbbpPZn2AEyrA85mDnDf94JDcadQCiJGzhvqU",
          "./chunk-64WOUHHJ.js": "sha384-hTdulOFDbDpZPDXTPSqo9asD5kf/Rb2nqqOwqK/IzWWXyf8kf0+N94FSvSjPLKtF",
          "/playground/explore/chunk-OZQ6JKLG.js": "sha384-EE7BH7bSlYWqlWwtX7XpM9W0PZ2//G7BqyakMEs/pFXcJ6+//8vSk6lTMHYireMh",
          "/playground/explore/chunk-2TRNGCRW.js": "sha384-6hXJvFjPa/Ufsst94QotFiaYUAFrFFhAU7K03uURw2sZGyo064nsZ8xCev9jL6yz",
          "/playground/explore/chunk-2VMXMS7J.js": "sha384-MbmUQ39oLPov5C9InEUR8yVadKAjZyiGDT3KYnTOmh2QKqme4N8P2KbWMIWeLdA6",
          "/playground/checkout/chunk-HAURFVXL.js": "sha384-ijCh9YcKYcx1eQWhGHJDJXyJWWRwzIQLAb4jGjJwj5/PuPvgqVeo/weHXV9tBIBT",
          "/playground/checkout/chunk-IXVRQ3XI.js": "sha384-isAK0+MzGJzJndw+laXhLYBADqNo/BxIg/IbapvKoCllwjUl+Yy2Wh0MFt0wZPqX",
          "/playground/checkout/chunk-DDWWMX3L.js": "sha384-y5fRkstpEzberTAn+YJ/+etSy+OTbP3qN2ikAAfvOx7ru7ZA7+HhLk7xEl7usven",
          "/playground/checkout/chunk-SA4XMAC3.js": "sha384-nFOHlB1YFi/1qDCcMbTVX5eeurKr4kHbZmv9Ik6GzP7VaycBlENjZhyrt6s5+7Dx",
          "/playground/checkout/chunk-2VMXMS7J.js": "sha384-MbmUQ39oLPov5C9InEUR8yVadKAjZyiGDT3KYnTOmh2QKqme4N8P2KbWMIWeLdA6",
          "/playground/decide/chunk-DUTPQ56Q.js": "sha384-SpzTuAJud/ZE8zVnFna/JoIhDjbzSJ59AxOF8OdnMIGPDdXfV9Sr2GCgojwClU3D"
        }
      }
    ],
    "effective": {
      "imports": [
        {
          "specifier": "@angular/common",
          "target": "https://native-federation.github.io/playground/_angular_common.G-CZnQLQoU.js"
        },
        {
          "specifier": "@angular/common/http",
          "target": "https://native-federation.github.io/playground/_angular_common_http.rvzjQNS0mn.js"
        },
        {
          "specifier": "@angular/core",
          "target": "https://native-federation.github.io/playground/_angular_core.EWio10v_5e.js"
        },
        {
          "specifier": "@angular/core/event-dispatch-contract.min.js",
          "target": "https://native-federation.github.io/playground/_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js"
        },
        {
          "specifier": "@angular/core/primitives/di",
          "target": "https://native-federation.github.io/playground/_angular_core_primitives_di.HXp0bO89XM.js"
        },
        {
          "specifier": "@angular/core/primitives/event-dispatch",
          "target": "https://native-federation.github.io/playground/_angular_core_primitives_event_dispatch.8Y6FZIJL61.js"
        },
        {
          "specifier": "@angular/core/primitives/signals",
          "target": "https://native-federation.github.io/playground/_angular_core_primitives_signals.oN7Cdd5oIf.js"
        },
        {
          "specifier": "@angular/core/rxjs-interop",
          "target": "https://native-federation.github.io/playground/_angular_core_rxjs_interop.Sn3puXfArQ.js"
        },
        {
          "specifier": "@angular/elements",
          "target": "https://native-federation.github.io/playground/explore/_angular_elements.ktmx-SsBF0.js"
        },
        {
          "specifier": "@angular/platform-browser",
          "target": "https://native-federation.github.io/playground/_angular_platform_browser.djzJcPG8PR.js"
        },
        {
          "specifier": "rxjs",
          "target": "https://native-federation.github.io/playground/rxjs._3LcsHIuu_.js"
        },
        {
          "specifier": "rxjs/operators",
          "target": "https://native-federation.github.io/playground/rxjs_operators.G4NPpguNIR.js"
        },
        {
          "specifier": "tslib",
          "target": "https://native-federation.github.io/playground/tslib.BX2MinpEcV.js"
        },
        {
          "specifier": "@ng-internal/navigation",
          "target": "https://native-federation.github.io/playground/_ng_internal_navigation-WQQSOTRO.js"
        },
        {
          "specifier": "@ng-internal/url",
          "target": "https://native-federation.github.io/playground/_ng_internal_url-OGK476M3.js"
        },
        {
          "specifier": "@ng-internal/event-bus",
          "target": "https://native-federation.github.io/playground/_ng_internal_event_bus-IIHRXBFG.js"
        },
        {
          "specifier": "@ng-internal/ui",
          "target": "https://native-federation.github.io/playground/_ng_internal_ui-JVYKD4IB.js"
        },
        {
          "specifier": "@angular/forms",
          "target": "https://native-federation.github.io/playground/checkout/_angular_forms.UAUsqxOWM3.js"
        },
        {
          "specifier": "@angular/router",
          "target": "https://native-federation.github.io/playground/_angular_router.kRPE6gwl6L.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-home",
          "target": "https://native-federation.github.io/playground/explore/mfe-home-QJGJZXVQ.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-category",
          "target": "https://native-federation.github.io/playground/explore/mfe-category-3SNGYRGZ.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-stores",
          "target": "https://native-federation.github.io/playground/explore/mfe-stores-SY4FLME3.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-header",
          "target": "https://native-federation.github.io/playground/explore/mfe-header-W2OE6E3A.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-footer",
          "target": "https://native-federation.github.io/playground/explore/mfe-footer-7QGH7EAH.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-recommendations",
          "target": "https://native-federation.github.io/playground/explore/mfe-recommendations-KZYO4SSQ.js"
        },
        {
          "specifier": "@tractor-store/explore/mfe-store-picker",
          "target": "https://native-federation.github.io/playground/explore/mfe-store-picker-PCDPARLG.js"
        },
        {
          "specifier": "@tractor-store/explore/nav-contribution",
          "target": "https://native-federation.github.io/playground/explore/nav-contribution-R3ZWNATU.js"
        },
        {
          "specifier": "@tractor-store/decide/mfe-product",
          "target": "https://native-federation.github.io/playground/decide/mfe-product-Z2FO2S6K.js"
        },
        {
          "specifier": "@tractor-store/decide/nav-contribution",
          "target": "https://native-federation.github.io/playground/decide/nav-contribution-URY657DC.js"
        },
        {
          "specifier": "@tractor-store/checkout/mfe-cart",
          "target": "https://native-federation.github.io/playground/checkout/mfe-cart-64T76C25.js"
        },
        {
          "specifier": "@tractor-store/checkout/mfe-checkout",
          "target": "https://native-federation.github.io/playground/checkout/mfe-checkout-GQBIYLTK.js"
        },
        {
          "specifier": "@tractor-store/checkout/mfe-thanks",
          "target": "https://native-federation.github.io/playground/checkout/mfe-thanks-WWAFN7GC.js"
        },
        {
          "specifier": "@tractor-store/checkout/mfe-mini-cart",
          "target": "https://native-federation.github.io/playground/checkout/mfe-mini-cart-AMFV52KE.js"
        },
        {
          "specifier": "@tractor-store/checkout/mfe-add-to-cart",
          "target": "https://native-federation.github.io/playground/checkout/mfe-add-to-cart-FDBMIFST.js"
        },
        {
          "specifier": "@tractor-store/checkout/nav-contribution",
          "target": "https://native-federation.github.io/playground/checkout/nav-contribution-Y3U46EMY.js"
        }
      ],
      "scopes": [
        {
          "scope": "https://native-federation.github.io/playground/",
          "imports": [
            {
              "specifier": "@nf-internal/chunk-MO7I3UEP",
              "target": "https://native-federation.github.io/playground/chunk-MO7I3UEP.js"
            },
            {
              "specifier": "@nf-internal/chunk-6BOBWJD7",
              "target": "https://native-federation.github.io/playground/chunk-6BOBWJD7.js"
            },
            {
              "specifier": "@nf-internal/chunk-ZR2C3J5K",
              "target": "https://native-federation.github.io/playground/chunk-ZR2C3J5K.js"
            },
            {
              "specifier": "@nf-internal/chunk-LD32UVVN",
              "target": "https://native-federation.github.io/playground/chunk-LD32UVVN.js"
            },
            {
              "specifier": "@nf-internal/chunk-QMUFVTBX",
              "target": "https://native-federation.github.io/playground/chunk-QMUFVTBX.js"
            },
            {
              "specifier": "@nf-internal/chunk-PZNONLPT",
              "target": "https://native-federation.github.io/playground/chunk-PZNONLPT.js"
            },
            {
              "specifier": "@nf-internal/chunk-64WOUHHJ",
              "target": "https://native-federation.github.io/playground/chunk-64WOUHHJ.js"
            }
          ]
        },
        {
          "scope": "https://native-federation.github.io/playground/explore/",
          "imports": [
            {
              "specifier": "@nf-internal/chunk-OZQ6JKLG",
              "target": "https://native-federation.github.io/playground/explore/chunk-OZQ6JKLG.js"
            },
            {
              "specifier": "@nf-internal/chunk-2TRNGCRW",
              "target": "https://native-federation.github.io/playground/explore/chunk-2TRNGCRW.js"
            },
            {
              "specifier": "@nf-internal/chunk-2VMXMS7J",
              "target": "https://native-federation.github.io/playground/explore/chunk-2VMXMS7J.js"
            }
          ]
        },
        {
          "scope": "https://native-federation.github.io/playground/checkout/",
          "imports": [
            {
              "specifier": "@nf-internal/chunk-HAURFVXL",
              "target": "https://native-federation.github.io/playground/checkout/chunk-HAURFVXL.js"
            },
            {
              "specifier": "@nf-internal/chunk-IXVRQ3XI",
              "target": "https://native-federation.github.io/playground/checkout/chunk-IXVRQ3XI.js"
            },
            {
              "specifier": "@nf-internal/chunk-DDWWMX3L",
              "target": "https://native-federation.github.io/playground/checkout/chunk-DDWWMX3L.js"
            },
            {
              "specifier": "@nf-internal/chunk-SA4XMAC3",
              "target": "https://native-federation.github.io/playground/checkout/chunk-SA4XMAC3.js"
            },
            {
              "specifier": "@nf-internal/chunk-2VMXMS7J",
              "target": "https://native-federation.github.io/playground/checkout/chunk-2VMXMS7J.js"
            }
          ]
        },
        {
          "scope": "https://native-federation.github.io/playground/decide/",
          "imports": [
            {
              "specifier": "@nf-internal/chunk-DUTPQ56Q",
              "target": "https://native-federation.github.io/playground/decide/chunk-DUTPQ56Q.js"
            }
          ]
        }
      ],
      "integrityFor": [
        "https://native-federation.github.io/playground/_angular_common.G-CZnQLQoU.js",
        "https://native-federation.github.io/playground/_angular_common_http.rvzjQNS0mn.js",
        "https://native-federation.github.io/playground/_angular_core.EWio10v_5e.js",
        "https://native-federation.github.io/playground/_angular_core_event_dispatch_contract_min_js.3axcNP9xmW.js",
        "https://native-federation.github.io/playground/_angular_core_primitives_di.HXp0bO89XM.js",
        "https://native-federation.github.io/playground/_angular_core_primitives_event_dispatch.8Y6FZIJL61.js",
        "https://native-federation.github.io/playground/_angular_core_primitives_signals.oN7Cdd5oIf.js",
        "https://native-federation.github.io/playground/_angular_core_rxjs_interop.Sn3puXfArQ.js",
        "https://native-federation.github.io/playground/explore/_angular_elements.ktmx-SsBF0.js",
        "https://native-federation.github.io/playground/_angular_platform_browser.djzJcPG8PR.js",
        "https://native-federation.github.io/playground/rxjs._3LcsHIuu_.js",
        "https://native-federation.github.io/playground/rxjs_operators.G4NPpguNIR.js",
        "https://native-federation.github.io/playground/tslib.BX2MinpEcV.js",
        "https://native-federation.github.io/playground/_ng_internal_navigation-WQQSOTRO.js",
        "https://native-federation.github.io/playground/_ng_internal_url-OGK476M3.js",
        "https://native-federation.github.io/playground/_ng_internal_event_bus-IIHRXBFG.js",
        "https://native-federation.github.io/playground/_ng_internal_ui-JVYKD4IB.js",
        "https://native-federation.github.io/playground/checkout/_angular_forms.UAUsqxOWM3.js",
        "https://native-federation.github.io/playground/_angular_router.kRPE6gwl6L.js",
        "https://native-federation.github.io/playground/explore/mfe-home-QJGJZXVQ.js",
        "https://native-federation.github.io/playground/explore/mfe-category-3SNGYRGZ.js",
        "https://native-federation.github.io/playground/explore/mfe-stores-SY4FLME3.js",
        "https://native-federation.github.io/playground/explore/mfe-header-W2OE6E3A.js",
        "https://native-federation.github.io/playground/explore/mfe-footer-7QGH7EAH.js",
        "https://native-federation.github.io/playground/explore/mfe-recommendations-KZYO4SSQ.js",
        "https://native-federation.github.io/playground/explore/mfe-store-picker-PCDPARLG.js",
        "https://native-federation.github.io/playground/explore/nav-contribution-R3ZWNATU.js",
        "https://native-federation.github.io/playground/decide/mfe-product-Z2FO2S6K.js",
        "https://native-federation.github.io/playground/decide/nav-contribution-URY657DC.js",
        "https://native-federation.github.io/playground/checkout/mfe-cart-64T76C25.js",
        "https://native-federation.github.io/playground/checkout/mfe-checkout-GQBIYLTK.js",
        "https://native-federation.github.io/playground/checkout/mfe-thanks-WWAFN7GC.js",
        "https://native-federation.github.io/playground/checkout/mfe-mini-cart-AMFV52KE.js",
        "https://native-federation.github.io/playground/checkout/mfe-add-to-cart-FDBMIFST.js",
        "https://native-federation.github.io/playground/checkout/nav-contribution-Y3U46EMY.js",
        "https://native-federation.github.io/playground/chunk-MO7I3UEP.js",
        "https://native-federation.github.io/playground/chunk-6BOBWJD7.js",
        "https://native-federation.github.io/playground/chunk-ZR2C3J5K.js",
        "https://native-federation.github.io/playground/chunk-LD32UVVN.js",
        "https://native-federation.github.io/playground/chunk-QMUFVTBX.js",
        "https://native-federation.github.io/playground/chunk-PZNONLPT.js",
        "https://native-federation.github.io/playground/chunk-64WOUHHJ.js",
        "https://native-federation.github.io/playground/explore/chunk-OZQ6JKLG.js",
        "https://native-federation.github.io/playground/explore/chunk-2TRNGCRW.js",
        "https://native-federation.github.io/playground/explore/chunk-2VMXMS7J.js",
        "https://native-federation.github.io/playground/checkout/chunk-HAURFVXL.js",
        "https://native-federation.github.io/playground/checkout/chunk-IXVRQ3XI.js",
        "https://native-federation.github.io/playground/checkout/chunk-DDWWMX3L.js",
        "https://native-federation.github.io/playground/checkout/chunk-SA4XMAC3.js",
        "https://native-federation.github.io/playground/checkout/chunk-2VMXMS7J.js",
        "https://native-federation.github.io/playground/decide/chunk-DUTPQ56Q.js"
      ]
    }
  },
  "errors": []
};
